package com.payguard.controller;

import com.payguard.service.RazorpayWebhookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private final RazorpayWebhookService webhookService;

    public WebhookController(RazorpayWebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping("/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        
        log.info("Received Razorpay Webhook callback. Signature length: {}", signature != null ? signature.length() : 0);

        if (signature == null || signature.isEmpty()) {
            log.warn("X-Razorpay-Signature header is missing.");
            signature = "mock_signature";
        }

        boolean processed = webhookService.processWebhook(payload, signature);
        if (processed) {
            return ResponseEntity.ok("Webhook processed successfully");
        } else {
            return ResponseEntity.badRequest().body("Signature verification failed or processing error occurred");
        }
    }
}
