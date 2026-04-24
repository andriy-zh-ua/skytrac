# Protocol Buffers Makefile for Skytrac Project

.PHONY: help generate clean install-deps

# Default target
help:
	@echo "Available commands:"
	@echo "  install-deps - Install protobuf dependencies"
	@echo "  setup-dirs   - Create directories"
	@echo "  generate     - Generate Go protobuf files"
	@echo "  clean        - Remove all generated files"

# Install dependencies
install-deps:
	@echo "Installing protobuf dependencies..."
	# Go dependencies
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Create directories
setup-dirs:
	@mkdir -p generated/go

# Generate Go files
generate: setup-dirs
	@echo "Generating Go files..."
	protoc \
		--go_out=generated/go \
		--go_opt=paths=source_relative \
		--go-grpc_out=generated/go \
		--go-grpc_opt=paths=source_relative \
		--proto_path=. \
		telemetry.proto
	@echo "Go files generated in generated/go/"

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -rf generated/
	@echo "Clean complete!"
