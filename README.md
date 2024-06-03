![Copy of Copy of Copy of Copy of Copy of Untitled Design](https://github.com/HelloblueAI/Bleu.js/assets/81389644/f8af8623-d7fe-4a17-bac9-1bcfc05fd67f)

# Bleu.js


Bleu.js is a framework designed to solve various coding problems that many developers face today. It provides a unified platform combining advanced debugging and real-time optimization suggestions, supports multiple programming languages, offers automated code generation ("eggs"), enhances collaboration with a user-friendly interface, automates dependency management, and provides lightweight code quality assurance.

## Directory Structure

- **core-engine**: Contains the main logic for debugging, optimization, and code generation.
- **language-plugins**: Modules for different programming languages.
  - **javascript**: JavaScript-specific tools.
  - **python**: Python-specific tools.
- **ui**: User interface for interacting with Bleu.js.
- **collaboration-tools**: Tools for code review, issue tracking, and project management.
- **dependency-management**: Tools for monitoring and managing dependencies.
- **code-quality-assurance**: Tools for continuous code quality checks and analysis.
- **eggs-generator**: Tools for generating code snippets and optimization suggestions.
- **docker**: Docker configuration files.

## Getting Started

1. Install dependencies:
   `npm install`
## Build and run the Docker container
`docker-compose up --build`

## Access the application:
* Navigate to http://localhost:3000 to see the welcome message.

# Example Usage
## Debugging Code
To debug code using Bleu.js, you can send a POST request to the /debug endpoint with the code you want to debug:
`curl -X POST http://localhost:3000/debug -H "Content-Type: application/json" -d '{"code": "console.log(\"Hello, world!\");"}'`

## Optimizing Code
To optimize code using Bleu.js, you can send a POST request to the /optimize endpoint with the code you want to optimize:
`curl -X POST http://localhost:3000/optimize -H "Content-Type: application/json" -d '{"code": "console.log(\"Hello, world!\");"}`

## Generating Code
To generate code using Bleu.js, you can send a POST request to the /generate endpoint with the template you want to use:
`curl -X POST http://localhost:3000/generate -H "Content-Type: application/json" -d '{"template": "basic function"}'`


# License
Bleu.js is licensed under the [MIT License](https://opensource.org/license/MIT) - see the LICENSE file for details.

## Author
Pejman Haghighatnia
