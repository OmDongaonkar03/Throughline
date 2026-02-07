import prisma from "../db/prisma.js";
import { isLLMConfigured, getAvailableProviders } from "../lib/llm-config.js";

export const healthCheck = async (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

export const detailedHealthCheck = async (req, res) => {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "unknown",
    checks: {},
  };

  // Check 1: Database Connection
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    healthStatus.checks.database = {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      message: "Database connection successful",
    };
  } catch (error) {
    healthStatus.status = "unhealthy";
    healthStatus.checks.database = {
      status: "unhealthy",
      error: error.message,
      message: "Database connection failed",
    };
  }

  // Check 2: LLM Provider Configuration
  try {
    const llmConfigured = isLLMConfigured();
    const providers = getAvailableProviders();

    if (llmConfigured && providers.length > 0) {
      healthStatus.checks.llm = {
        status: "healthy",
        providers: providers.map((p) => p.provider),
        primaryProvider: providers[0]?.provider || "none",
        message: "LLM provider configured",
      };
    } else {
      healthStatus.status = "degraded";
      healthStatus.checks.llm = {
        status: "degraded",
        providers: [],
        message: "No LLM provider configured - AI features disabled",
      };
    }
  } catch (error) {
    healthStatus.status = "degraded";
    healthStatus.checks.llm = {
      status: "unhealthy",
      error: error.message,
      message: "LLM configuration check failed",
    };
  }

  // Check 3: Email Configuration
  const emailConfigured =
    process.env.MAIL_HOST &&
    process.env.MAIL_USER &&
    process.env.MAIL_PASS;

  healthStatus.checks.email = {
    status: emailConfigured ? "healthy" : "degraded",
    configured: emailConfigured,
    message: emailConfigured
      ? "Email service configured"
      : "Email service not configured",
  };

  // Check 4: Required Environment Variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "FRONTEND_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    healthStatus.status = "unhealthy";
    healthStatus.checks.environment = {
      status: "unhealthy",
      missing: missingEnvVars,
      message: "Required environment variables missing",
    };
  } else {
    healthStatus.checks.environment = {
      status: "healthy",
      message: "All required environment variables present",
    };
  }

  // Check 5: Memory Usage
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  // Warn if heap usage is above 80%
  const heapUsagePercent = (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100;
  
  healthStatus.checks.memory = {
    status: heapUsagePercent > 80 ? "degraded" : "healthy",
    usage: memoryUsageMB,
    heapUsagePercent: Math.round(heapUsagePercent),
    message:
      heapUsagePercent > 80
        ? "High memory usage detected"
        : "Memory usage normal",
  };

  // Check 6: Scheduler Status
  const cronDisabled = process.env.DISABLE_INTERNAL_CRON === "true";
  
  healthStatus.checks.scheduler = {
    status: cronDisabled ? "disabled" : "enabled",
    message: cronDisabled
      ? "Internal scheduler disabled (using external cron)"
      : "Internal scheduler running",
  };

  // Overall status determination
  const unhealthyChecks = Object.values(healthStatus.checks).filter(
    (check) => check.status === "unhealthy"
  );
  
  const degradedChecks = Object.values(healthStatus.checks).filter(
    (check) => check.status === "degraded"
  );

  if (unhealthyChecks.length > 0) {
    healthStatus.status = "unhealthy";
  } else if (degradedChecks.length > 0) {
    healthStatus.status = "degraded";
  }

  // Return appropriate HTTP status code
  const statusCode =
    healthStatus.status === "healthy"
      ? 200
      : healthStatus.status === "degraded"
        ? 200
        : 503;

  res.status(statusCode).json(healthStatus);
};

export const readinessCheck = async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check required env vars
    const requiredEnvVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
    ];

    const allEnvPresent = requiredEnvVars.every(
      (varName) => process.env[varName]
    );

    if (!allEnvPresent) {
      return res.status(503).json({
        ready: false,
        message: "Required environment variables missing",
      });
    }

    res.json({
      ready: true,
      message: "Application ready to serve traffic",
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      message: "Application not ready",
      error: error.message,
    });
  }
};

/**
 * Liveness check
 */
export const livenessCheck = async (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
};