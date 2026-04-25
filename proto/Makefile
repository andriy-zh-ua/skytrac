# Protocol Buffers Makefile for Skytrac Project

PROTO_DIR=.
GEN_DIR=generated/

.PHONY: help setup-dirs install-deps init-module generate clean

# Default target
help:
	@echo "Available commands:"
	@echo "  install-deps - Install protobuf dependencies"
	@echo "  setup-dirs   - Create directories"
	@echo "  generate     - Generate Go protobuf files"
	@echo "  clean        - Remove all generated files"

# Create directories
setup-dirs:
	mkdir -p $(GEN_DIR)

# Install dependencies
install-deps:
	echo "Installing protobuf dependencies..."
	# Go dependencies
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Initialize Go module
init-module:
	if [ ! -f go.mod ]; then \
		echo "Initializing Go module..."; \
		go mod init a2solution.ca/skytrac/proto; \
	else \
		echo "Go module already exists"; \
	fi

# Generate Go files
generate: setup-dirs init-module setup-dirs
	@echo "Generating Go files..."
	protoc \
		--proto_path=$(PROTO_DIR) \
		--go_out=$(GEN_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) \
		--go-grpc_opt=paths=source_relative \
		$(PROTO_DIR)/telemetry.proto
	@echo "Go files generated in $(GEN_DIR)"

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -rf $(GEN_DIR)
	@echo "Clean complete!"
