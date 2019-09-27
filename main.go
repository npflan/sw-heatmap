package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"
)

type Service struct {
	Client       *http.Client
	SwitchRegexp *regexp.Regexp
}

type PromDataMetric struct {
	Instance string `json:"instance"`
}

type PromDataResult struct {
	Metric PromDataMetric `json:"metric"`
	Value  []interface{}  `json:"value"`
}

type PromData struct {
	ResultType string           `json:"resultType"`
	Results    []PromDataResult `json:"result"`
}

type PromBody struct {
	Status string   `json:"status"`
	Data   PromData `json:"data"`
}

type SwitchInfo struct {
	Name string `json:"name"`
	Num  int    `json:"num"`
}

var (
	promURL = "http://10.97.10.10:9090/api/v1/query?query=probe_success"
	logger  = zap.NewExample()
)

func (s *Service) getProm(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	req, err := http.NewRequest("GET", promURL, nil)
	if err != nil {
		logger.Error(
			"Failed to create request",
			zap.Error(err),
		)
	}

	resp, err := s.Client.Do(req)
	if err != nil {
		logger.Error(
			"Failed to call prometheus",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error(
			"Failed to read prom response body",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	var promResp PromBody
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		logger.Error(
			"Unmarshal json failed",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	respInfo := make([]SwitchInfo, 0, 0)
	for _, result := range promResp.Data.Results {
		if result.Value[1] == "1" {
			continue
		}

		areaName := strings.Split(result.Metric.Instance, ".")[0]
		splitString := s.SwitchRegexp.FindString(areaName)
		if splitString == "" {
			continue
		}
		areaNum := strings.Split(areaName, splitString)[1]
		if areaNum == "" {
			areaNum = "1"
		}
		areaNumInt, err := strconv.Atoi(areaNum)
		if err != nil {
			logger.Error(
				"Failed to cast areaNum to int",
				zap.Error(err),
			)
			http.Error(w, err.Error(), 500)
			return
		}
		var info SwitchInfo
		info.Name = strings.ToUpper(splitString)
		info.Num = areaNumInt
		respInfo = append(respInfo, info)
	}

	output, err := json.Marshal(respInfo)
	if err != nil {
		logger.Error(
			"Failed to create request",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(output)

	if err != nil {
		logger.Error(
			"Failed to write response",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}
	return
}

func serve() error {
	tr := &http.Transport{
		MaxIdleConns:    10,
		IdleConnTimeout: 30 * time.Second,
	}
	client := &http.Client{Transport: tr}
	regex := regexp.MustCompile(`[a-zA-Z]{2,}`)
	svc := Service{
		Client:       client,
		SwitchRegexp: regex,
	}

	http.HandleFunc("/", svc.getProm)
	logger.Info("Work work")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		return err
	}
	return nil
}

func main() {
	err := serve()
	if err != nil {
		panic(err)
	}
}
