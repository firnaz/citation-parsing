var app;
$jit.ForceDirected.Plot.EdgeTypes.implement({
    'double_arrow': {
        'render': function(adj, canvas) {

            var from = adj.nodeFrom.pos.getc(true),
                to = adj.nodeTo.pos.getc(true),
                dim = adj.getData('dim'),
                ctx = canvas.getCtx(),
                vect = new $jit.Complex(to.x - from.x, to.y - from.y),
                nodeFrom = adj.nodeFrom,
                nodeTo = adj.nodeTo, arrowfrom=false, arrowto=false;
            if($.inArray(nodeTo.id,nodeFrom.data.from)>=0 || $.inArray(nodeFrom.id,nodeTo.data.to)>=0){
				arrowfrom=true;
            }
            if($.inArray(nodeTo.id,nodeFrom.data.to)>=0 || $.inArray(nodeFrom.id,nodeTo.data.from)>=0){
				arrowto=true;
            }
            vect.$scale(dim / vect.norm());
            //Needed for drawing the first arrow
            var intermediatePoint = new $jit.Complex(to.x - vect.x, to.y - vect.y),
                normal = new $jit.Complex(-vect.y / 2, vect.x / 2),
                v1 = intermediatePoint.add(normal),
                v2 = intermediatePoint.$add(normal.$scale(-1));

            var vect2 = new $jit.Complex(to.x - from.x, to.y - from.y);
            vect2.$scale(dim / vect2.norm());
            //Needed for drawing the second arrow
            var intermediatePoint2 = new $jit.Complex(from.x + vect2.x, from.y + vect2.y),
                normal = new $jit.Complex(-vect2.y / 2, vect2.x / 2),
                v12 = intermediatePoint2.add(normal),
                v22 = intermediatePoint2.$add(normal.$scale(-1));

            //Drawing the double arrow on the canvas, first the line, then the ends
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
			if(arrowto){
				ctx.beginPath();
				ctx.moveTo(v1.x, v1.y);
				ctx.lineTo(v2.x, v2.y);
				ctx.lineTo(to.x, to.y);
				ctx.closePath();
				ctx.fill();
			}
			if(arrowfrom){
				ctx.beginPath();
				ctx.moveTo(v12.x, v12.y);
				ctx.lineTo(v22.x, v22.y);
				ctx.lineTo(from.x, from.y);
				ctx.closePath();
				ctx.fill();
			}
        }
    }
});

$(document).ready(function(){
	app = new tkidp();
	$("#search_submit,#header_search_submit").click(function(e){
		app.search_submit(e);
	});
	$("#search_form").submit(function(e){
		app.search_submit(e);
	});
	$("#publevel1").change(function(){
		if(this.checked) {
			app.showNodes(fd,{tipe:1});
		}else{
			app.hideNodes(fd,{tipe:1});
		}
	});
	$("#publevel2").change(function(){
		if(this.checked) {
			app.showNodes(fd,{tipe:2});
		}else{
			app.hideNodes(fd,{tipe:2});
		}
	});
	$("#publevel3").change(function(){
		if(this.checked) {
			app.showNodes(fd,{tipe:3});
		}else{
			app.hideNodes(fd,{tipe:3});
		}
	});
	$("#DownloadGraph").click(function(e){
		e.preventDefault();
		var canvasWrapper = fd.canvas.getElement();
		var canvas = $(canvasWrapper).find("canvas")[0];
		var dataURL = canvas.toDataURL();
		app.downloadImage(dataURL);
	});
	$('#graph .toolbar input:radio[name="filtergraph"]').change(
	    function(){
	    	console.log($(this).val());
	        app.refreshCiteGraph(fd,fd.root.replace("node",""),$(this).val());
	        // if ($(this).val() == 'Yes') {
	        // }
	        // else {

	        //     // if it's the 'No' button removes the 'appended' element.
	        //     $(appended).remove();
	        // }
	    }
	);
});