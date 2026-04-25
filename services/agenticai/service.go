package main

import (
	"context"
	"log"
	"net"
	"time"

	pb "a2solution.ca/skytrac/proto/generated"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type service struct {
	pb.UnimplementedFlightTelemetryServiceServer
}

func (s *service) SendAircraftTelemetry(ctx context.Context, in *pb.AircraftTelemetry) (*pb.AircraftControlMessage, error) {
	targetAltitude := float32(100.0)
	targetSpeed := float32(500.0)
	targetBearing := float32(10.0)

	return &pb.AircraftControlMessage{
		MessageId:     "",
		EventTime:     timestamppb.New(time.Now()), // UTC time by default
		CorrelationId: "",
		Payload: &pb.AircraftControlMessage_Command{
			Command: &pb.FlightCommand{
				Type:           pb.CommandType_COMMAND_TYPE_CONTINUE_ROUTE,
				Priority:       pb.CommandPriority_COMMAND_PRIORITY_LOW,
				Message:        "Test message",
				TargetAltitude: &targetAltitude,
				TargetSpeed:    &targetSpeed,
				TargetBearing:  &targetBearing,
				CommandId:      "test-command-id",
			},
		},
	}, nil
}

func main() {
	port := ":50051"

	listener, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	defer listener.Close()

	grpcServer := grpc.NewServer()

	pb.RegisterFlightTelemetryServiceServer(grpcServer, &service{})

	log.Printf("gRPC server running on port %s...", port)
	err = grpcServer.Serve(listener)
	if err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
