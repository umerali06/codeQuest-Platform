<?php

namespace CodeQuest\Core;

class Router
{
    private $routes = [];
    private $params = [];

    public function get($path, $handler)
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post($path, $handler)
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put($path, $handler)
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete($path, $handler)
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute($method, $path, $handler)
    {
        $this->routes[$method][$path] = $handler;
    }

    public function handle($method, $uri)
    {
        $path = parse_url($uri, PHP_URL_PATH);
        
        if (!isset($this->routes[$method])) {
            $this->notFound();
        }

        foreach ($this->routes[$method] as $route => $handler) {
            $pattern = $this->convertRouteToRegex($route);
            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches); // Remove full match
                $this->params = $matches;
                $this->executeHandler($handler);
                return;
            }
        }

        $this->notFound();
    }

    private function convertRouteToRegex($route)
    {
        return '#^' . preg_replace('#:([a-zA-Z]+)#', '([^/]+)', $route) . '$#';
    }

    private function executeHandler($handler)
    {
        if (is_array($handler)) {
            $class = $handler[0];
            $method = $handler[1];
            
            if (!class_exists($class)) {
                throw new \Exception("Controller class {$class} not found");
            }
            
            $controller = new $class();
            if (!method_exists($controller, $method)) {
                throw new \Exception("Method {$method} not found in {$class}");
            }
            
            $controller->$method($this->params);
        } else {
            call_user_func($handler, $this->params);
        }
    }

    private function notFound()
    {
        http_response_code(404);
        echo json_encode([
            'error' => 'Not Found',
            'message' => 'The requested resource was not found'
        ]);
        exit();
    }

    public function getParams()
    {
        return $this->params;
    }
}
