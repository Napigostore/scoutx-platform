import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ConsoleLogger,
  MetricsRegistry,
  NoOpTracer,
  DependencyHealthChecker,
  EnvironmentValidator,
  GlobalErrorMapper,
  AppError,
} from "../src/index.js";

describe("Observability Package Tests", () => {
  describe("Logger", () => {
    it("should log structured JSON and sanitize sensitive keys", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const logger = new ConsoleLogger({}, "info");

      logger.info("Test message", { password: "super-secret-password", safeKey: "safe-value" });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedObj = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedObj.message).toBe("Test message");
      expect(loggedObj.password).toBe("[REDACTED]");
      expect(loggedObj.safeKey).toBe("safe-value");

      consoleSpy.mockRestore();
    });

    it("should support child loggers with inherited context", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const parent = new ConsoleLogger({ parentId: "123" }, "info");
      const child = parent.child({ childId: "456" });

      child.info("Child message");

      expect(consoleSpy).toHaveBeenCalled();
      const loggedObj = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedObj.parentId).toBe("123");
      expect(loggedObj.childId).toBe("456");

      consoleSpy.mockRestore();
    });
  });

  describe("Metrics", () => {
    it("should record counter, gauge, and histogram metrics", () => {
      const registry = new MetricsRegistry();
      const counter = registry.counter("test_counter");
      const gauge = registry.gauge("test_gauge");
      const histogram = registry.histogram("test_histogram");

      counter.inc(5);
      gauge.set(42);
      histogram.observe(0.15);
      histogram.observe(0.25);

      const snapshot = registry.getMetricsSnapshot();
      expect(snapshot.test_counter).toBe(5);
      expect(snapshot.test_gauge).toBe(42);
      expect(snapshot.test_histogram).toEqual([0.15, 0.25]);
    });
  });

  describe("Tracing", () => {
    it("should start spans using NoOpTracer", () => {
      const tracer = new NoOpTracer();
      const span = tracer.startSpan("test-span");
      expect(span).toBeDefined();
      expect(() => span.setAttribute("key", "value").end()).not.toThrow();
    });
  });

  describe("Health Checks", () => {
    it("should aggregate health check statuses", async () => {
      const checker = new DependencyHealthChecker([
        { name: "db", check: async () => ({ status: "UP" }) },
        { name: "cache", check: async () => ({ status: "DOWN", details: { latency: "high" } }) },
      ]);

      const result = await checker.checkAll();
      expect(result.status).toBe("DOWN");
      expect(result.details.db.status).toBe("UP");
      expect(result.details.cache.status).toBe("DOWN");
    });
  });

  describe("Config Validation", () => {
    it("should validate valid configuration and return immutable object", () => {
      const validEnv = {
        NODE_ENV: "production",
        PORT: "8080",
        DATABASE_URL: "postgresql://localhost:5432/db",
        JWT_SECRET: "super-long-secret-key-123456",
        LOG_LEVEL: "warn",
      };

      const config = EnvironmentValidator.validate(validEnv);
      expect(config.PORT).toBe(8080);
      expect(config.LOG_LEVEL).toBe("warn");
      expect(() => {
        (config as any).PORT = 9090;
      }).toThrow();
    });

    it("should throw startup failure when secrets are missing or invalid", () => {
      const invalidEnv = {
        NODE_ENV: "production",
        PORT: "invalid-port",
        DATABASE_URL: "not-a-url",
        JWT_SECRET: "short",
      };

      expect(() => EnvironmentValidator.validate(invalidEnv)).toThrow(/Startup Configuration Validation Failed/);
    });
  });

  describe("Error Mapping & Correlation ID", () => {
    it("should map generic errors to AppError and propagate correlation ID", () => {
      const genericError = new Error("Something went wrong");
      const mapped = GlobalErrorMapper.map(genericError, "corr-123");

      expect(mapped).toBeInstanceOf(AppError);
      expect(mapped.code).toBe("INTERNAL_SERVER_ERROR");
      expect(mapped.correlationId).toBe("corr-123");

      const payload = mapped.toPayload();
      expect(payload.success).toBe(false);
      expect(payload.error.correlationId).toBe("corr-123");
    });
  });
});
