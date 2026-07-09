package com.payguard.service;

import com.payguard.model.Order;
import com.payguard.model.OrderStatus;
import com.payguard.repository.OrderRepository;
import com.razorpay.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RazorpayWebhookService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookService.class);
    private final OrderRepository orderRepository;
    private final RiskEngineService riskEngineService;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    public RazorpayWebhookService(OrderRepository orderRepository, RiskEngineService riskEngineService) {
        this.orderRepository = orderRepository;
        this.riskEngineService = riskEngineService;
    }

    /**
     * Processes the raw webhook payload.
     */
    public boolean processWebhook(String payload, String signature) {
        // 1. Verify Signature (bypass if no webhook secret configured or using simulated signature)
        if (webhookSecret != null && !webhookSecret.trim().isEmpty() && !"mock_signature".equals(signature)) {
            try {
                boolean isValid = Utils.verifyWebhookSignature(payload, signature, webhookSecret);
                if (!isValid) {
                    log.error("Webhook signature verification failed.");
                    return false;
                }
            } catch (Exception e) {
                log.error("Error verifying webhook signature: {}", e.getMessage());
                return false;
            }
        } else {
            log.info("Signature verification bypassed (Mock mode or signature='mock_signature')");
        }

        // 2. Parse Webhook Event
        try {
            JSONObject eventJson = new JSONObject(payload);
            String event = eventJson.optString("event");
            log.info("Processing webhook event: {}", event);

            if ("payment.captured".equals(event)) {
                return handlePaymentCaptured(eventJson);
            } else if ("payment.failed".equals(event)) {
                return handlePaymentFailed(eventJson);
            } else {
                log.info("Ignoring unhandled event: {}", event);
                return true;
            }
        } catch (Exception e) {
            log.error("Failed to parse webhook JSON payload: {}", e.getMessage());
            return false;
        }
    }

    private boolean handlePaymentCaptured(JSONObject eventJson) {
        JSONObject paymentEntity = eventJson.getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity");

        String razorpayOrderId = paymentEntity.optString("order_id");
        String razorpayPaymentId = paymentEntity.optString("id");
        long amountInPaise = paymentEntity.optLong("amount");

        if (razorpayOrderId == null || razorpayOrderId.isEmpty()) {
            log.warn("Webhook payment.captured contains no order_id. Skipping.");
            return true;
        }

        // Idempotency: check if payment ID is already processed
        Optional<Order> orderWithPaymentId = orderRepository.findByRazorpayPaymentId(razorpayPaymentId);
        if (orderWithPaymentId.isPresent()) {
            log.info("Payment ID: {} already processed. Ignoring duplicate webhook.", razorpayPaymentId);
            return true;
        }

        Optional<Order> orderOpt = orderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (orderOpt.isEmpty()) {
            log.warn("No local order found for Razorpay Order ID: {}. Skipping.", razorpayOrderId);
            return true;
        }

        Order order = orderOpt.get();

        // If order is already finalized, skip
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.FLAGGED) {
            log.info("Order ID: {} is already in status: {}. Skipping.", order.getId(), order.getStatus());
            return true;
        }

        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setStatus(OrderStatus.ATTEMPTED);
        order = orderRepository.save(order); // Track intermediate attempted status

        // Run Risk Evaluation
        RiskEngineService.RiskAssessment assessment = riskEngineService.assessRisk(order, amountInPaise);

        order.setRiskScore(assessment.getScore());
        order.setRiskReasons(String.join(", ", assessment.getReasons()));

        if (assessment.getScore() > 70) {
            order.setStatus(OrderStatus.FLAGGED);
            log.warn("[ALERT] Order ID: {} FLAGGED due to high fraud risk (Score: {})", order.getId(), assessment.getScore());
        } else {
            order.setStatus(OrderStatus.PAID);
            log.info("Order ID: {} successfully verified and set to PAID", order.getId());
        }

        orderRepository.save(order);
        return true;
    }

    private boolean handlePaymentFailed(JSONObject eventJson) {
        JSONObject paymentEntity = eventJson.getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity");

        String razorpayOrderId = paymentEntity.optString("order_id");
        String razorpayPaymentId = paymentEntity.optString("id");

        if (razorpayOrderId == null || razorpayOrderId.isEmpty()) {
            return true;
        }

        Optional<Order> orderOpt = orderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setRazorpayPaymentId(razorpayPaymentId);
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            log.info("Order ID: {} set to FAILED based on webhook event.", order.getId());
        }
        return true;
    }
}
