package com.payguard.controller;

import com.payguard.model.Order;
import com.payguard.model.OrderStatus;
import com.payguard.repository.OrderRepository;
import com.payguard.service.OrderService;
import com.payguard.service.ReconciliationScheduler;
import com.payguard.service.RiskEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ReconciliationScheduler reconciliationScheduler;
    private final RiskEngineService riskEngineService;

    public OrderController(OrderService orderService, OrderRepository orderRepository, 
                           ReconciliationScheduler reconciliationScheduler, RiskEngineService riskEngineService) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.reconciliationScheduler = reconciliationScheduler;
        this.riskEngineService = riskEngineService;
    }

    public static class CreateOrderRequest {
        private String productId;
        private String customerIdentifier;
        private String ipAddress;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public String getCustomerIdentifier() { return customerIdentifier; }
        public void setCustomerIdentifier(String customerIdentifier) { this.customerIdentifier = customerIdentifier; }

        public String getIpAddress() { return ipAddress; }
        public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    }

    public static class ResolveOrderRequest {
        private String action; // APPROVE or REJECT

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            Order order = orderService.createOrder(
                    request.getProductId(),
                    request.getCustomerIdentifier(),
                    request.getIpAddress()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Too many requests")) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders(@RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(orderService.getAllOrders(status));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<?> resolveOrder(@PathVariable Long id, @RequestBody ResolveOrderRequest request) {
        try {
            Order resolvedOrder = orderService.resolveOrder(id, request.getAction());
            return ResponseEntity.ok(resolvedOrder);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/reconciliation/alerts")
    public ResponseEntity<List<ReconciliationScheduler.ReconciliationAlert>> getReconciliationAlerts() {
        return ResponseEntity.ok(reconciliationScheduler.getActiveAlerts());
    }

    @PostMapping("/reconciliation/clear")
    public ResponseEntity<?> clearReconciliationAlerts() {
        reconciliationScheduler.clearAlerts();
        return ResponseEntity.ok().build();
    }

    /**
     * Simulation endpoint to demonstrate fraud flagging.
     */
    @PostMapping("/simulate-attack")
    public ResponseEntity<?> simulateAttack(@RequestParam String customerIdentifier) {
        log.info("[Simulation] Triggering simulated fraud attack for customer: {}", customerIdentifier);
        
        LocalDateTime now = LocalDateTime.now();
        String mockRazorpayOrderId = "order_sim_" + UUID.randomUUID().toString().substring(0, 8);

        // Attempt 1: IP 192.168.1.10
        Order o1 = Order.builder()
                .productId("prod_sub")
                .amount(99900L)
                .status(OrderStatus.CREATED)
                .customerIdentifier(customerIdentifier)
                .ipAddress("192.168.1.10")
                .createdAt(now.minusSeconds(15))
                .razorpayOrderId("order_sim_o1_" + UUID.randomUUID().toString().substring(0, 4))
                .build();
        
        // Attempt 2: IP 192.168.1.11 (triggers IP change!)
        Order o2 = Order.builder()
                .productId("prod_sub")
                .amount(99900L)
                .status(OrderStatus.CREATED)
                .customerIdentifier(customerIdentifier)
                .ipAddress("192.168.1.11")
                .createdAt(now.minusSeconds(10))
                .razorpayOrderId("order_sim_o2_" + UUID.randomUUID().toString().substring(0, 4))
                .build();

        // Attempt 3: IP 192.168.1.10
        Order o3 = Order.builder()
                .productId("prod_dev")
                .amount(249900L)
                .status(OrderStatus.CREATED)
                .customerIdentifier(customerIdentifier)
                .ipAddress("192.168.1.10")
                .createdAt(now.minusSeconds(5))
                .razorpayOrderId("order_sim_o3_" + UUID.randomUUID().toString().substring(0, 4))
                .build();

        orderRepository.save(o1);
        orderRepository.save(o2);
        orderRepository.save(o3);

        // Attempt 4: Target order that will be flagged
        Order targetOrder = Order.builder()
                .productId("prod_sub")
                .amount(99900L)
                .status(OrderStatus.CREATED)
                .customerIdentifier(customerIdentifier)
                .ipAddress("192.168.1.10")
                .createdAt(now)
                .razorpayOrderId(mockRazorpayOrderId)
                .build();

        targetOrder = orderRepository.save(targetOrder);

        // Webhook simulated amount: 50000 paise (500 INR) instead of 99900 paise.
        long tamperedAmount = 50000L;
        String mockPaymentId = "pay_sim_" + UUID.randomUUID().toString().substring(0, 8);

        targetOrder.setRazorpayPaymentId(mockPaymentId);
        targetOrder.setStatus(OrderStatus.ATTEMPTED);
        targetOrder = orderRepository.save(targetOrder);

        // Run Risk Evaluation
        RiskEngineService.RiskAssessment assessment = riskEngineService.assessRisk(targetOrder, tamperedAmount);
        
        targetOrder.setRiskScore(assessment.getScore());
        targetOrder.setRiskReasons(String.join(", ", assessment.getReasons()));

        if (assessment.getScore() > 70) {
            targetOrder.setStatus(OrderStatus.FLAGGED);
            log.warn("[Simulation] Flagged target order due to risk score {}", assessment.getScore());
        } else {
            targetOrder.setStatus(OrderStatus.PAID);
        }

        Order saved = orderRepository.save(targetOrder);
        return ResponseEntity.ok(saved);
    }

    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) { this.error = error; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
