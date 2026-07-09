package com.payguard.service;

import com.payguard.model.Order;
import com.payguard.repository.OrderRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RiskEngineService {

    private static final Logger log = LoggerFactory.getLogger(RiskEngineService.class);
    private final OrderRepository orderRepository;

    public RiskEngineService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public static class RiskAssessment {
        private int score;
        private List<String> reasons;

        public RiskAssessment(int score, List<String> reasons) {
            this.score = score;
            this.reasons = reasons;
        }

        public int getScore() {
            return score;
        }

        public List<String> getReasons() {
            return reasons;
        }
    }

    /**
     * Assesses the risk of an order based on fraud detection rules.
     */
    public RiskAssessment assessRisk(Order order, Long webhookAmountInPaise) {
        int score = 0;
        List<String> reasons = new ArrayList<>();
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusSeconds(60);

        // 1. Amount Mismatch Check
        if (webhookAmountInPaise != null && !webhookAmountInPaise.equals(order.getAmount())) {
            score += 50;
            String reason = "Amount tampering detected (DB: " + order.getAmount() + " paise, Webhook: " + webhookAmountInPaise + " paise)";
            reasons.add(reason);
            log.warn("[Risk Engine] {} for Order ID: {}", reason, order.getId());
        }

        // 2. Velocity Check
        int attemptsInLastMinute = orderRepository.countByCustomerIdentifierAndCreatedAtAfter(
                order.getCustomerIdentifier(), oneMinuteAgo
        );
        if (attemptsInLastMinute > 3) {
            score += 40;
            String reason = "High velocity check: " + attemptsInLastMinute + " attempts in last 60 seconds";
            reasons.add(reason);
            log.warn("[Risk Engine] {} for Customer: {}", reason, order.getCustomerIdentifier());
        }

        // 3. Rapid IP Change Check
        List<Order> recentOrders = orderRepository.findByCustomerIdentifierAndCreatedAtAfterOrderByCreatedAtDesc(
                order.getCustomerIdentifier(), oneMinuteAgo
        );
        boolean ipChanged = false;
        String currentIp = order.getIpAddress();
        for (Order recentOrder : recentOrders) {
            if (!recentOrder.getIpAddress().equalsIgnoreCase(currentIp)) {
                ipChanged = true;
                break;
            }
        }
        if (ipChanged) {
            score += 30;
            String reason = "Rapid IP change check: Customer IP changed within last 60 seconds";
            reasons.add(reason);
            log.warn("[Risk Engine] {} for Customer: {}", reason, order.getCustomerIdentifier());
        }

        log.info("[Risk Engine] Assessment complete for Order ID: {}. Final Score: {}, Triggered Reasons: {}",
                order.getId(), score, reasons);

        return new RiskAssessment(score, reasons);
    }
}
