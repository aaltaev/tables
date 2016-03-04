var pdfFile = null;
var currPage = 1, numPages = 0;
var pdfDoc = null;
var canvases = [];
var backgrounds = [];
var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
var isMouseDown = false;

function fileHandler() {
    pdfFile = null;
    currPage = 1;
    numPages = 0;
    pdfDoc = null;
    canvases = [];
    backgrounds = [];
    x1 = 0;
    x2 = 0;
    y1 = 0;
    y2 = 0;
    isMouseDown = false;

    document.getElementById("pdf").innerHTML = '';
    document.getElementById("pdfformhidden").innerHTML = '';
    var x = document.getElementById("inpdf");
    if ('files' in x && x.files.length > 0) {
        var description = document.createElement('p');
        description.classList.add("lead");
        description.classList.add("text-justify");
        description.innerHTML = "Select area for table extraction on each page. If you want to extract from the whole page, make no selection";
        document.getElementById('pdf').appendChild(description);
        [].forEach.call(x.files, function (f, i) {
            var reader = new FileReader();
            reader.onload = function (event) {
                pdfFile = new Uint8Array(this.result);
                handlePdf(pdfFile);
            };
            reader.readAsArrayBuffer(f);
        });

    }

}

function handlePdf(pdfFile) {
    PDFJS.getDocument(pdfFile).then(function (pdf) {
        pdfDoc = pdf;
        numPages = pdf.numPages;
        pdf.getPage(1).then(handlePages);
    });
}

function handlePages(page) {

    var viewport = page.getViewport(1);
    var scale = document.getElementById("pdf").clientWidth / viewport.width;
    console.log(scale);
    viewport = page.getViewport(scale);
    var canvas = document.createElement('canvas');
    canvases[currPage] = canvas;
    canvas.id = "pdfcanvas" + currPage;
    canvas.style.border = '1px solid black';
    var ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    page.render({canvasContext: ctx, viewport: viewport});


    document.getElementById("pdf").appendChild(canvas);
    var dropBtn = document.createElement('button');
    dropBtn.id = 'drop' + currPage;
    dropBtn.innerText = "Drop selection";
    dropBtn.onclick = function () {
        var id = parseInt(this.id.replace('drop', ''));
        canvases[id].getContext('2d').putImageData(backgrounds[id], 0, 0);
        document.getElementById('startX' + id).value = '';
        document.getElementById('startY' + id).value = '';
        document.getElementById('endX' + id).value = '';
        document.getElementById('endY' + id).value = '';
    };
    document.getElementById("pdf").appendChild(document.createElement('br'));
    document.getElementById("pdf").appendChild(dropBtn);
    document.getElementById("pdf").appendChild(document.createElement('br'));
    document.getElementById("pdf").appendChild(document.createElement('br'));

    canvas.addEventListener('mousedown', mouseDownHandler, false);
    canvas.addEventListener('mouseup', mouseUpHandler, false);
    canvas.addEventListener('mousemove', mouseMoveHandler, false);

    var form = document.getElementById('pdfformhidden');

    var input = document.createElement("input");
    input.type = 'hidden';
    input.id = ('startX' + currPage);
    input.name = input.id;
    form.appendChild(input);

    input = document.createElement("input");
    input.type = 'hidden';
    input.id = ('startY' + currPage);
    input.name = input.id;
    form.appendChild(input);

    input = document.createElement("input");
    input.type = 'hidden';
    input.id = ('endX' + currPage);
    input.name = input.id;
    form.appendChild(input);

    input = document.createElement("input");
    input.type = 'hidden';
    input.id = ('endY' + currPage);
    input.name = input.id;
    form.appendChild(input);


    currPage++;
    if (pdfDoc != null && currPage <= numPages) {
        pdfDoc.getPage(currPage).then(handlePages);
    }
}

function mouseDownHandler(event) {
    if (event.button == 0) {
        var id = parseInt(event.target.id.replace('pdfcanvas', ''));
        var canvas = canvases[id];
        if (backgrounds[id] == null) {
            backgrounds[id] = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        }
        x1 = event.pageX - getCoords(canvas).left;//canvas.offsetLeft;;
        y1 = event.pageY - getCoords(canvas).top;//canvas.offsetTop;
        //console.log(canvas.);
        //console.log(canvas.offsetTop);
        isMouseDown = true;
    }
}

function mouseMoveHandler(event) {
    if (isMouseDown) {
        var id = parseInt(event.target.id.replace('pdfcanvas', ''));
        var canvas = canvases[id];
        var context = canvas.getContext('2d');

        x2 = event.pageX - getCoords(canvas).left;//canvas.offsetLeft;
        y2 = event.pageY - getCoords(canvas).top;//canvas.offsetTop;
        console.log(canvas.offsetLeft);
        console.log(canvas.offsetTop);
        context.globalAlpha = 0.3;
        var width = x2 - x1;
        var height = y2 - y1;
        context.beginPath();
        context.fillStyle = "#FF0000";
        context.putImageData(backgrounds[id], 0, 0);
        context.fillRect(x1, y1, width, height);
        context.globalAlpha = 1.0;
        context.rect(x1, y1, width, height);
        context.stroke();
        context.closePath();
    }
}

function mouseUpHandler(event) {
    if (event.button == 0) {
        var id = parseInt(event.target.id.replace('pdfcanvas', ''));
        var canvas = canvases[id];

        y1 = canvas.height - y1;
        y2 = canvas.height - y2;

        var temp;
        if (x1 > x2) {
            temp = x1;
            x2 = x1;
            x1 = temp;
        }
        if (y1 > y2) {
            temp = y1;
            y1 = y2;
            y2 = temp;
        }

        document.getElementById('startX' + id).value = x1 / canvas.width;
        document.getElementById('startY' + id).value = y1 / canvas.height;
        document.getElementById('endX' + id).value = x2 / canvas.width;
        document.getElementById('endY' + id).value = y2 / canvas.height;

        isMouseDown = false;
    }
}

function getCoords(elem) { // crossbrowser version
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return {top: Math.round(top), left: Math.round(left)};
}