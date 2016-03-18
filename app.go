package main

import (
	"github.com/aaltaev/tables/utils"

	"github.com/codegangsta/martini"
	"github.com/martini-contrib/render"
	"html/template"

	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
)

func main() {
	m := martini.Classic()
	unescapeFuncMap := template.FuncMap{"unescape":utils.Unescape}
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

	err = extractTable(filename, utils.ParseSelection(request.MultipartForm.Value))
	if err != nil {
		fmt.Println(err)
	}

	render.HTML(200, "table", utils.GetHtmlExcel(filename))
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
