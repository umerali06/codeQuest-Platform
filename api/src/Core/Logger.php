<?php

namespace CodeQuest\Core;

use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Formatter\LineFormatter;

class Logger
{
    private $logger;
    private $logFile;

    public function __construct()
    {
        $this->logFile = __DIR__ . '/../../../logs/app.log';
        $this->ensureLogDirectory();
        $this->initializeLogger();
    }

    private function ensureLogDirectory()
    {
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }

    private function initializeLogger()
    {
        $this->logger = new MonologLogger('CodeQuest');
        
        // File handler with rotation
        $fileHandler = new RotatingFileHandler($this->logFile, 30, MonologLogger::DEBUG);
        $fileHandler->setFormatter(new LineFormatter(
            "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
            'Y-m-d H:i:s'
        ));
        
        $this->logger->pushHandler($fileHandler);
        
        // Console handler for development
        if ($_ENV['APP_ENV'] ?? 'development' === 'development') {
            $consoleHandler = new StreamHandler('php://stdout', MonologLogger::DEBUG);
            $consoleHandler->setFormatter(new LineFormatter(
                "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
                'Y-m-d H:i:s'
            ));
            $this->logger->pushHandler($consoleHandler);
        }
    }

    public function emergency($message, array $context = [])
    {
        $this->logger->emergency($message, $context);
    }

    public function alert($message, array $context = [])
    {
        $this->logger->alert($message, $context);
    }

    public function critical($message, array $context = [])
    {
        $this->logger->critical($message, $context);
    }

    public function error($message, array $context = [])
    {
        $this->logger->error($message, $context);
    }

    public function warning($message, array $context = [])
    {
        $this->logger->warning($message, $context);
    }

    public function notice($message, array $context = [])
    {
        $this->logger->notice($message, $context);
    }

    public function info($message, array $context = [])
    {
        $this->logger->info($message, $context);
    }

    public function debug($message, array $context = [])
    {
        $this->logger->debug($message, $context);
    }

    public function log($level, $message, array $context = [])
    {
        $this->logger->log($level, $message, $context);
    }
}
