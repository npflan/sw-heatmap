package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/kelseyhightower/envconfig"
	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"

	"go.uber.org/zap"
)

type Specification struct {
	PrometheusURL string `envconfig:"prometheus_url"`
	MetricsQuery  string `envconfig:"metrics_query"`
}
type SwitchInfo struct {
	Name  string `json:"name"`
	Num   int    `json:"num"`
	State int    `json:"state"`
}

var (
	logger = zap.NewExample()
)

func (s *Specification) callPrometheus() (model.Vector, error) {
	logger.Info("Querying")

	client, err := api.NewClient(api.Config{
		Address: s.PrometheusURL,
	})
	if err != nil {
		logger.Error("Could not create client")
	}
	v1api := v1.NewAPI(client)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	result, _, err := v1api.Query(ctx, "probe_success", time.Now())
	if err != nil {
		logger.Error("Error querying Prometheus: %v\n", zap.Error(err))
		return nil, err
	}

	switch result.Type() {
	case model.ValVector:
		modelVector := result.(model.Vector)
		return modelVector, nil
	default:
		err := fmt.Errorf("unexpected value type %q", result.Type())
		return nil, err
	}
}

func parseMetric(vector model.Vector) []SwitchInfo {
	logger.Info("Handling request")
	switchNameRegex := regexp.MustCompile(`[a-zA-Z]{2,}`)
	switchNameNumRegex := regexp.MustCompile(`[a-zA-Z]{2,}[0-9]{1,}`)
	switchNumRegex := regexp.MustCompile(`[0-9]{1,}`)
	switchesData := make([]SwitchInfo, 0)

	for _, sample := range vector {
		instanceName := sample.Metric["instance"]
		if !instanceName.IsValid() {
			continue
		}
		instanceSplit := strings.Split(string(instanceName), ".")
		if len(instanceSplit) == 0 {
			continue
		}

		switchName := switchNameRegex.FindString(instanceSplit[0])
		if switchName == "" {
			continue
		}

		switchNum := switchNumRegex.FindString(switchNameNumRegex.FindString(instanceSplit[0]))
		if switchNum == "" {
			switchNum = "1"
		}
		switchNumInt, err := strconv.Atoi(switchNum)
		if err != nil {
			continue
		}

		var switchData SwitchInfo
		switchData.State = int(sample.Value)
		switchData.Name = strings.ToUpper(switchName)
		switchData.Num = switchNumInt
		switchesData = append(switchesData, switchData)

		logger.Info(fmt.Sprint("SwitchData - Name: ", switchData.Name, ", Number: ", switchData.Num, ", State: ", switchData.State))
	}
	return switchesData
}

func writeSwitchData(w http.ResponseWriter, switchesData []SwitchInfo) error {
	byteArr, err := json.Marshal(switchesData)
	if err != nil {
		logger.Error("Failed to create request", zap.Error(err))
		return err
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(byteArr)
	if err != nil {
		logger.Error("Failed to write response", zap.Error(err))
		return err
	}
	return nil
}

func (s *Specification) handlePrometheusInteraction(w http.ResponseWriter, r *http.Request) {
	vector, err := s.callPrometheus()
	if err != nil {
		logger.Error("Calling prometheus failed")
		return
	}

	switchesData := parseMetric(vector)

	err = writeSwitchData(w, switchesData)
	if err != nil {
		logger.Error("Writing switch data failed")
		return
	}
}

func (s *Specification) serve() error {
	http.HandleFunc("/", s.handlePrometheusInteraction)
	logger.Info("Starting to serve master...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		return err
	}
	return nil
}

func main() {

	var s Specification
	err := envconfig.Process("sw_heatmap", &s)
	if err != nil {
		panic(err)
	}

	logger.Info(fmt.Sprint("Proceeding with promURL: ", s.PrometheusURL, ", query: ", s.MetricsQuery))

	err = s.serve()
	if err != nil {
		panic(err)
	}
}
