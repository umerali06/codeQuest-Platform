<?php

namespace CodeQuest\Core;

class Logger
{
    private $logFile;

    public function __construct()
    {
        $this->logFile = __DIR__ . '/../../../logs/app.log';
        $dir = dirname($this->logFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    public function info($message, array $context = [])
    {
        $this->log('INFO', $message, $context);
    }

    public function error($message, array $context = [])
    {
        $this->log('ERROR', $message, $context);
    }

    public function warning($message, array $context = [])
    {
        $this->log('WARNING', $message, $context);
    }

    public function debug($message, array $context = [])
    {
        $this->log('DEBUG', $message, $context);
    }

    public function critical($message, array $context = [])
    {
        $this->log('CRITICAL', $message, $context);
    }

    private function log($level, $message, array $context = [])
    {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        $logEntry = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}
