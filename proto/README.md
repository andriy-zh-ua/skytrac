# Protocol Buffers for Skytrac Project

This directory contains Protocol Buffers definitions for the Skytrac telemetry system.

## Directory Structure

```
proto/
├── README.md                # This file
├── telemetry.proto          # Main telemetry definitions
├── generated/               # Auto-generated files (DO NOT EDIT)
│   ├── telemetry.pb.go      # Go protocol buffer implementation
│   └── telemetry_grpc.pb.go # gRPC service definitions
├── go.mod                   # Go module file (auto-generated)
└── Makefile                 # Build commands
```

## Protocol Buffer Files

### `telemetry.proto`
Contains enhanced telemetry message definitions with gRPC services:
- `FlightTelemetryService` - gRPC service for bidirectional communication
- `AircraftTelemetry` - Enhanced telemetry wrapper with sequence numbers and timestamps
- `AircraftControlMessage` - Server-to-client control messages
- `FlightState` - Comprehensive flight state information
- `GeoPosition` - Geographic coordinates (latitude, longitude)
- `EnvironmentalData` - Environmental conditions (pressure, humidity, temperature)
- `FlightCommand` - Flight control commands with priorities
- Enums: `AircraftState`, `FuelStatus`, `CommandType`, `CommandPriority`

## Generated Files

The `generated/` directory contains auto-generated files from the `.proto` files:

### Go (`generated/`)
- `telemetry.pb.go` - Go protocol buffer implementation
- `telemetry_grpc.pb.go` - gRPC service definitions

## Build Commands

Use the Makefile to generate the protobuf files:

```bash
# Create directories only
make setup-dirs

# Install protobuf dependencies
make install-deps

# Initialize Go module only
make init-module

# Generate Go files (automatically creates go.mod if needed)
make generate

# Clean generated files
make clean
```

The Makefile automatically:
- Creates the `generated/` directory
- Initializes a Go module (`go.mod`) if it doesn't exist
- Generates both protobuf and gRPC Go files
- Places them in the `generated/` directory with source-relative paths

## Usage

### Creating Telemetry Messages
```go
import "a2solution.ca/skytrac/proto/generated"
import "google.golang.org/protobuf/types/known/timestamppb"

// Create aircraft telemetry message
telemetry := &telemetry.AircraftTelemetry{
    AircraftId: "flight-123",
    State: &telemetry.FlightState{
        Altitude: 5000,
        Speed: 450,
        Position: &telemetry.GeoPosition{
            Latitude:  45.3225,
            Longitude: -75.6672,
        },
        Bearing: 10,
        FuelStatus: telemetry.FuelStatus_FUEL_STATUS_NORMAL,
        AircraftState: telemetry.AircraftState_AIRCRAFT_STATE_CRUISING,
        MaintenanceRequired: false,
        ProgressPercentage: 50,
        SegmentIndex: 1,
        TimeElapsed: 3600,
        FlightCompleted: false,
        DistanceTraveled: 10000,
        RemainingDistance: 5000,
        EnvironmentData: &telemetry.EnvironmentalData{
            Pressure: 1013.25,
            Humidity: 50,
            Temperature: 20,
        },
    },
    EventTime: timestamppb.New(time.Now()),
    TelemetryId: "telemetry-123",
    SequenceNumber: 1,
}
```

### gRPC Service Implementation
```go
import "a2solution.ca/skytrac/proto/generated"
import "google.golang.org/grpc"

// Server implementation
type telemetryServer struct {
    telemetry.UnimplementedFlightTelemetryServiceServer
}

func (s *telemetryServer) SendAircraftTelemetry(ctx context.Context, req *telemetry.AircraftTelemetry) (*telemetry.AircraftControlMessage, error) {
    // Process incoming telemetry
    log.Printf("Received telemetry from aircraft %s", req.AircraftId)
    
    // Return control message
    return &telemetry.AircraftControlMessage{
        MessageId: generateMessageId(),
        EventTime: timestamppb.New(time.Now()),
        CorrelationId: req.TelemetryId,
        Payload: &telemetry.AircraftControlMessage_Command{
            Command: &telemetry.FlightCommand{
                Type:     telemetry.CommandType_COMMAND_TYPE_CONTINUE_ROUTE,
                Priority: telemetry.CommandPriority_COMMAND_PRIORITY_NORMAL,
                Message:  "Flight path confirmed",
                CommandId: generateCommandId(),
            },
        },
    }, nil
}

// Client usage
func sendTelemetry(client telemetry.FlightTelemetryServiceClient, telemetryMsg *telemetry.AircraftTelemetry) error {
    response, err := client.SendAircraftTelemetry(context.Background(), telemetryMsg)
    if err != nil {
        return fmt.Errorf("failed to send telemetry: %w", err)
    }
    
    // Handle control response
    if cmd := response.GetCommand(); cmd != nil {
        log.Printf("Received command: %s (priority: %v)", cmd.Message, cmd.Priority)
        // Execute command logic here
    }
    
    return nil
}
```

## Module Configuration

### Go Package Option
```protobuf
option go_package = "a2solution.ca/skytrac/proto/generated;telemetry";
```

This configuration:
- Sets the module path to `a2solution.ca/skytrac/proto/generated`
- Uses `telemetry` as the Go package name
- Enables proper module resolution with replace directives

### Service Integration
Services using this protobuf should include the following in their `go.mod`:

```go
// In service go.mod
replace a2solution.ca/skytrac/proto => ../../../proto
```

## Important Notes

- **NEVER EDIT** files in the `generated/` directory
- Always regenerate files after modifying `.proto` files
- The `generated/` directory is added to `.gitignore`
- Use the Makefile for consistent generation
- **Automatic Module Creation**: The Makefile automatically creates `go.mod` if needed
- **Google Protobuf Import**: Uses `google/protobuf/timestamp.proto` for standard timestamps
- **gRPC Support**: Requires gRPC plugins for Go code generation
- **Go Only**: This protobuf is configured for Go language generation only
- **Replace Directive**: Services must use replace directive to point to local proto directory
