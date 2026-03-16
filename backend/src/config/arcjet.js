import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import { ENV } from "./env.js";

// Initialize Arcjet with security rules
// Arcjet is a security layer that protects your API from attacks, bots, and abuse
export const aj = arcjet({
    key: ENV.ARCJET_KEY, // Your Arcjet API key from environment variables
    characteristics: ["ip.src"], // Track requests by IP address
    rules: [
        // Shield: protects against common web attacks
        // (SQL Injection, XSS, CSRF, and other OWASP threats)
        shield({ mode: "LIVE" }),

        // Bot Detection: blocks malicious bots from accessing your API
        // "CATEGORY:SEARCH_ENGINE" allows legitimate bots like Google and Bing
        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Allow search engine crawlers (Googlebot, Bingbot, etc.)
            ],
        }),

        // Rate Limiting: limits how many requests a user can make using a token bucket algorithm
        // Token bucket works like this: each IP gets a bucket that fills with tokens over time.
        // Each request costs 1 token. If the bucket is empty, the request is blocked.
        tokenBucket({
            mode: "LIVE",
            refillRate: 10,  // Add 10 tokens every interval
            interval: 10,    // Refill every 10 seconds
            capacity: 15,    // Bucket holds a maximum of 15 tokens (allows short bursts)
        }),
    ],
});