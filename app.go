package main

import (
	"fmt"
	"github.com/codegangsta/martini"
	"github.com/martini-contrib/render"
	"html/template"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sort"
)

type HtmlExcel struct {
	Html  string
	Excel string
}

func main() {
	m := martini.Classic()

	unescapeFuncMap := template.FuncMap{"unescape":unescape}
	m.Use(render.Renderer(render.Options{
		Directory: "html",
		Layout: "layout",
		Funcs:[]template.FuncMap{unescapeFuncMap},
		Extensions: []string{".html"},
		Charset: "utf-8",
	}))
	options := martini.StaticOptions{Prefix:"resources"}
	m.Use(martini.Static("resources", options))
	m.Get("/", indexHandler)
	m.Post("/extract", extractHandler)
	m.Get("/download/:id", downloadHandler)
	m.Run()
}

func indexHandler(r render.Render) {
	r.HTML(200, "index", nil)
}

func extractHandler(render render.Render, request *http.Request, params martini.Params) {
	request.ParseMultipartForm(32 << 20)

	keys := make([]string, 0)
	values := request.MultipartForm.Value
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

	file, handler, err := request.FormFile("inpdf")
	if err != nil {
		fmt.Println(err)
		render.HTML(500, "error", "Something went wrong...")
		return
	}

	defer file.Close()
	filename := handler.Filename
	if _, err := os.Stat("./upload/" + filename); err == nil {
		filename = "(1)_" + filename
	}

	f, err := os.OpenFile("./upload/" + filename, os.O_WRONLY | os.O_CREATE, 0666)
	if err != nil {
		fmt.Println(err)
		render.Redirect("/")
		render.HTML(500, "error", "Something went wrong...")
		return
	}

	defer f.Close()
	io.Copy(f, file)

	parameters := ""
	for i, _ := range startX {
		parameters += appendList(values[startX[i]])
		parameters += appendList(values[startY[i]])
		parameters += appendList(values[endX[i]])
		parameters += appendList(values[endY[i]])
	}

	fmt.Println(parameters)

	err = extractTable(filename, parameters)
	if err != nil {
		fmt.Println(err)
	}

	render.HTML(200, "table", getHtmlExcel(filename))
}

func downloadHandler(render render.Render, params martini.Params) {
	dat, _ := ioutil.ReadFile("./upload/" + params["id"])
	render.Data(200, dat)
}

func extractTable(filename string, parameters string) error {
	_, err := exec.Command(
		"java", "-jar",
		"./extractor/cells_project.jar",
		"./upload/" + filename,
		parameters).CombinedOutput()
	if err != nil {
		return err
	}
	return nil
}

func unescape(escaped string) interface{} {
	return template.HTML(escaped)
}

// getHtmlExcel collects .html and .xlsx results
// of table extraction from pdf with filename name
func getHtmlExcel(filename string) []HtmlExcel {
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
