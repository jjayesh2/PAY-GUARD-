package com.payguard.model;

import java.util.HashMap;
import java.util.Map;

public class Product {
    private String id;
    private String name;
    private Long amount; // in paise

    private static final Map<String, Product> CATALOG = new HashMap<>();

    static {
        CATALOG.put("prod_sub", new Product("prod_sub", "Premium Monthly Subscription", 99900L)); // INR 999.00
        CATALOG.put("prod_dev", new Product("prod_dev", "Developer Pro Pack", 249900L));          // INR 2499.00
        CATALOG.put("prod_ent", new Product("prod_ent", "Enterprise API Access", 799900L));        // INR 7999.00
    }

    public Product() {}

    public Product(String id, String name, Long amount) {
        this.id = id;
        this.name = name;
        this.amount = amount;
    }

    public static Product getById(String id) {
        return CATALOG.get(id);
    }

    public static Map<String, Product> getCatalog() {
        return CATALOG;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }
}
