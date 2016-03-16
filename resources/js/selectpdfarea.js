var pdfFile = null;
var currPage = 1, numPages = 0;
var pdfDoc = null;
var canvases = [];
var backgrounds = [];
var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
var isMouseDown = false;

function fileHandler() {
    reset();
    var pdfInput = document.getElementById("inpdf");


    if ('files' in pdfInput && pdfInput.files.length > 0) {
        document.getElementById('submit').disabled = false;
        document.getElementById("pdfLabel").innerHTML = pdfInput.value.split(/(\\|\/)/g).pop();
        var description = document.createElement('p');
        description.classList.add("lead");
        description.classList.add("text-justify");
        description.innerHTML = "Select area for table extraction on each page. If you want to skip page, make no selection";
        document.getElementById('pdf').appendChild(description);

        [].forEach.call(pdfInput.files, function (f, i) {
            var reader = new FileReader();
            reader.onload = function (event) {
                pdfFile = new Uint8Array(this.result);
                handlePdf(pdfFile);
            };
            reader.readAsArrayBuffer(f);
        });
    } else {
        document.getElementById('submit').disabled = true;
    }
}

function reset() {
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
    document.getElementById("pdfLabel").innerHTML = 'No file selected';
}

function handlePdf(pdfFile) {
    PDFJS.getDocument(pdfFile).then(function (pdf) {
        pdfDoc = pdf;
        numPages = pdf.numPages;
        pdf.getPage(1).then(handlePages);
    });
}

function handlePages(page) {

    //create canvas for page and render current pdf page
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

    //create 'drop selection' button for current pdf page canvas
    document.getElementById("pdf").appendChild(canvas);
    var dropBtn = document.createElement('button');
    dropBtn.id = 'drop' + currPage;
    dropBtn.innerHTML = "Drop selection";
    dropBtn.onclick = function () { //dropping the selection
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
    form.appendChild(createInput('startX', currPage));
    form.appendChild(createInput('startY', currPage));
    form.appendChild(createInput('endX', currPage));
    form.appendChild(createInput('endY', currPage));

    //handling next page
    currPage++;
    if (pdfDoc != null && currPage <= numPages) {
        pdfDoc.getPage(currPage).then(handlePages);
    }
}

function createInput(id, number) {
    var input = document.createElement("input");
    input.type = 'hidden';
    input.id = (id + number);
    input.name = input.id;
    return input;
}

// mouse handlers
function mouseDownHandler(event) {
    if (event.button == 0) {
        var id = parseInt(event.target.id.replace('pdfcanvas', ''));
        var canvas = canvases[id];
        if (backgrounds[id] == null) {
            backgrounds[id] = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        }
        x1 = event.pageX - getCoords(canvas).left;
        y1 = event.pageY - getCoords(canvas).top;
        isMouseDown = true;
    }
}

function mouseMoveHandler(event) {
    if (isMouseDown) {
        var id = parseInt(event.target.id.replace('pdfcanvas', ''));
        var canvas = canvases[id];
        var context = canvas.getContext('2d');

        x2 = event.pageX - getCoords(canvas).left;
        y2 = event.pageY - getCoords(canvas).top;
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
            x1 = x2;
            x2 = temp;
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

// gets the coordinates of element on page
function getCoords(elem) {
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

function submitHandler() {
    document.getElementById('refresh').classList.remove("glyphicon-circle-arrow-up");
    document.getElementById('refresh').classList.add("glyphicon-refresh");
    document.getElementById('refresh').classList.add("glyphicon-refresh-animate");
    document.getElementById('submit').disabled = true;
}
