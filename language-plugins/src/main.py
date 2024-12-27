import os
from http.server import SimpleHTTPRequestHandler, HTTPServer
import logging
from urllib.parse import urlparse, parse_qs

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PythonServer")

# Configurable host and port
hostName = os.getenv("HOST", "localhost")
serverPort = int(os.getenv("PORT", 3002))

class MyServer(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse URL and query parameters
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)

        # Log the request
        logger.info(f"GET request for {self.path}")

        # Custom route handling
        if parsed_path.path == "/":
            self.handle_home()
        elif parsed_path.path == "/api/greet":
            self.handle_greet(query_params)
        else:
            self.handle_404()

    def handle_home(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(bytes("<html><body><h1>Welcome to Python Server!</h1></body></html>", "utf-8"))

    def handle_greet(self, query_params):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()

        # Extract 'name' parameter from query string
        name = query_params.get("name", ["stranger"])[0]
        response = {"message": f"Hello, {name}!"}
        self.wfile.write(bytes(str(response), "utf-8"))

    def handle_404(self):
        self.send_response(404)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(bytes("<html><body><h1>404 Not Found</h1></body></html>", "utf-8"))

if __name__ == "__main__":
    webServer = HTTPServer((hostName, serverPort), MyServer)
    logger.info(f"Server started at http://{hostName}:{serverPort}")

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server is stopping...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        webServer.server_close()
        logger.info("Server stopped.")
