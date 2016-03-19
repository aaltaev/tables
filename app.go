package main

import (
	"github.com/aaltaev/tables/utils"

	"github.com/codegangsta/martini"
	"github.com/martini-contrib/render"
	"html/template"

	"fmt"
	"io/ioutil"
	"net/http"
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
	m.Get("/pdfte", indexHandler)
	m.Post("/pdfte/extract", extractHandler)
	m.Get("/pdfte/download/:id", downloadHandler)
	m.Run()
}

func indexHandler(r render.Render) {
	r.HTML(200, "index", nil)
}

func extractHandler(render render.Render, request *http.Request, params martini.Params) {
	filename, err := utils.CopyFile(request)
	if err != nil {
		fmt.Println(err)
		render.HTML(500, "error", "Something went wrong...")
	}
	err = utils.ExtractTable(filename, utils.ParseSelection(request.MultipartForm.Value))
	if err != nil {
		fmt.Println(err)
	}
	render.HTML(200, "table", utils.GetHtmlExcel(filename))
}

func downloadHandler(render render.Render, params martini.Params) {
	dat, _ := ioutil.ReadFile("./upload/" + params["id"])
	render.Data(200, dat)
}
