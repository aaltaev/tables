package utils

import (
	"sort"
	"strings"
	"html/template"
	"io/ioutil"
)

type HtmlExcel struct {
	Html  string
	Excel string
}

func ParseSelection(values map[string][]string) string {
	keys := make([]string, 0)
	for key, _ := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	startX := make([]string, 0)
	startY := make([]string, 0)
	endX := make([]string, 0)
	endY := make([]string, 0)

	for _, v := range keys {
		if strings.Contains(v, "startX") {
			startX = append(startX, v)
		}else if strings.Contains(v, "startY") {
			startY = append(startY, v)
		}else if strings.Contains(v, "endX") {
			endX = append(endX, v)
		}else if strings.Contains(v, "endY") {
			endY = append(endY, v)
		}
	}

	parameters := ""
	for i, _ := range startX {
		parameters += appendList(values[startX[i]])
		parameters += appendList(values[startY[i]])
		parameters += appendList(values[endX[i]])
		parameters += appendList(values[endY[i]])
	}
	return parameters
}

func Unescape(escaped string) interface{} {
	return template.HTML(escaped)
}

// getHtmlExcel collects .html and .xlsx results
// of table extraction from pdf with filename name
func GetHtmlExcel(filename string) []HtmlExcel {
	htmlFiles, excelFiles := make([]string, 0), make([]string, 0)
	dir, _ := ioutil.ReadDir("./upload/")
	for _, fileinfo := range dir {
		if strings.Index(fileinfo.Name(), filename) == 0 {
			if strings.Contains(fileinfo.Name(), ".html") {
				dat, _ := ioutil.ReadFile("./upload/" + fileinfo.Name())
				htmlFiles = append(htmlFiles, string(dat))
			}
			if strings.Contains(fileinfo.Name(), ".xlsx") {
				excelFiles = append(excelFiles, fileinfo.Name())
			}
		}
	}
	htmlexcel := make([]HtmlExcel, 0)
	for i, _ := range htmlFiles {
		htmlexcel = append(htmlexcel, HtmlExcel{htmlFiles[i], excelFiles[i]})
	}
	return htmlexcel
}

func appendList(list []string) string {
	result := ""
	for _, val := range list {
		if val == "" {
			result += "0"
		}else {
			result += val;
		}
	}
	result += " "
	return result
}