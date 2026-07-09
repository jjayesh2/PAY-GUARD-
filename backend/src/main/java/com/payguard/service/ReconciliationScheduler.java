package com.payguard.service;

import com.payguard.model.Order;
import com.payguard.model.OrderStatus;
import com.payguard.repository.OrderRepository;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ReconciliationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationScheduler.class);
    private final OrderRepository orderRepository;
    private final RiskEngineService riskEngineService;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;

    // In-memory collection of active alerts
    private final List<ReconciliationAlert> activeAlerts = new CopyOnWriteArrayList<>();

    public static class ReconciliationAlert {
        private Long orderId;
        private String razorpayOrderId;
        private String localStatus;
        private String remoteStatus;
        private String alertMessage;
        private LocalDateTime detectedAt;

        public ReconciliationAlert(Long orderId, String razorpayOrderId, String localStatus, 
                                   String remoteStatus, String alertMessage, LocalDateTime detectedAt) {
            this.orderId = orderId;
            this.razorpayOrderId = razorpayOrderId;
            this.localStatus = localStatus;
            this.remoteStatus = remoteStatus;
            this.alertMessage = alertMessage;
            this.detectedAt = detectedAt;
        }

        public Long getOrderId() { return orderId; }
        public String getRazorpayOrderId() { return razorpayOrderId; }
        public String getLocalStatus() { return localStatus; }
        public String getRemoteStatus() { return remoteStatus; }
        public String getAlertMessage() { return alertMessage; }
        public LocalDateTime getDetectedAt() { return detectedAt; }
    }

    public ReconciliationScheduler(OrderRepository orderRepository, RiskEngineService riskEngineService) {
        this.orderRepository = orderRepository;
        this.riskEngineService = riskEngineService;
    }

    private void lazyInitClient() {
        if (razorpayClient == null && keyId != null && !keyId.trim().isEmpty() && keySecret != null && !keySecret.trim().isEmpty()) {
            try {
                this.razorpayClient = new RazorpayClient(keyId, keySecret);
            } catch (Exception e) {
                log.error("Failed to initialize Razorpay Client in Scheduler: {}", e.getMessage());
            }
        }
    }

    public List<ReconciliationAlert> getActiveAlerts() {
        return activeAlerts;
    }

    public void clearAlerts() {
        activeAlerts.clear();
    }

    @Scheduled(fixedRateString = "${reconciliation.rate.ms:30000}")
    public void runReconciliation() {
        log.info("[Reconciliation] Running reconciliation check...");
        lazyInitClient();

        // Reconcile orders from the last 12 hours
        LocalDateTime twelveHoursAgo = LocalDateTime.now().minusHours(12);
        List<Order> orders = orderRepository.findAll();
        // Filter locally created/attempted/flagged orders
        orders.removeIf(order -> order.getCreatedAt().isBefore(twelveHoursAgo));

        if (orders.isEmpty()) {
            log.info("[Reconciliation] No orders found to reconcile.");
            return;
        }

        // Keep track of current run alerts
        List<ReconciliationAlert> currentRunAlerts = new ArrayList<>();

        if (razorpayClient != null) {
            for (Order order : orders) {
                if (order.getRazorpayOrderId() == null || order.getRazorpayOrderId().startsWith("order_mock_")) {
                    continue;
                }

                try {
                    // Fetch payments for this Razorpay Order ID
                    List<Payment> payments = razorpayClient.orders.fetchPayments(order.getRazorpayOrderId());
                    String remoteStatus = "none";
                    boolean hasCapturedPayment = false;
                    String paymentId = null;

                    for (Payment payment : payments) {
                        String status = payment.get("status");
                        paymentId = payment.get("id");
                        if ("captured".equals(status)) {
                            hasCapturedPayment = true;
                            remoteStatus = "captured";
                            break;
                        } else if ("failed".equals(status)) {
                            remoteStatus = "failed";
                        } else {
                            remoteStatus = status;
                        }
                    }

                    // Check for status mismatches
                    if (hasCapturedPayment) {
                        if (order.getStatus() == OrderStatus.CREATED || order.getStatus() == OrderStatus.ATTEMPTED) {
                            String alertMsg = "Mismatch: Local order status is " + order.getStatus() 
                                    + " but Razorpay shows PAID (captured).";
                            currentRunAlerts.add(new ReconciliationAlert(
                                    order.getId(), order.getRazorpayOrderId(),
                                    order.getStatus().name(), "PAID (captured)",
                                    alertMsg, LocalDateTime.now()
                            ));
                            log.warn("[Reconciliation Alert] Order ID {}: {}", order.getId(), alertMsg);
                        }
                    } else if (order.getStatus() == OrderStatus.PAID) {
                        String alertMsg = "Mismatch: Local order status is PAID but Razorpay shows no captured payment (Remote status: " + remoteStatus + ").";
                        currentRunAlerts.add(new ReconciliationAlert(
                                order.getId(), order.getRazorpayOrderId(),
                                order.getStatus().name(), remoteStatus,
                                alertMsg, LocalDateTime.now()
                        ));
                        log.warn("[Reconciliation Alert] Order ID {}: {}", order.getId(), alertMsg);
                    }
                } catch (Exception e) {
                    log.error("Error fetching payments from Razorpay for order {}: {}", order.getRazorpayOrderId(), e.getMessage());
                }
            }
        } else {
            // MOCK MODE: Simulate a mismatch for demo validation
            // If there's a CREATED order that is more than 30 seconds old, trigger a mock alert
            for (Order order : orders) {
                if (order.getStatus() == OrderStatus.CREATED && order.getCreatedAt().isBefore(LocalDateTime.now().minusSeconds(30))) {
                    String alertMsg = "MOCK Alert: Order #" + order.getId() + " is locally CREATED but simulated Razorpay fetch shows status 'captured' (Reconciliation Test)";
                    currentRunAlerts.add(new ReconciliationAlert(
                            order.getId(), order.getRazorpayOrderId(),
                            "CREATED", "captured",
                            alertMsg, LocalDateTime.now()
                    ));
                    log.warn("[Reconciliation Mock Alert] Order ID {}: {}", order.getId(), alertMsg);
                }
            }
        }

        // Update the active alerts list
        activeAlerts.clear();
        activeAlerts.addAll(currentRunAlerts);
        log.info("[Reconciliation] Run finished. Found {} mismatches.", activeAlerts.size());
    }
}
