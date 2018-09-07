var defaultlinecolor = "#0D6797";
String.prototype.trunc = function(n,useWordBoundary){
	var toLong = this.length>n,
	s_ = toLong ? this.substr(0,n-1) : this;
	s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
	return  toLong ? s_ + '&hellip;' : s_;
};
function tkidp(){
	this.search_submit = function(e){
		e.preventDefault();
		var query = $("#search_input").val();
		if(!$.trim(query)){
			alert("Untuk melakukan pencarian anda harus memasukkan kata pencarian");
		}else{
			window.location.href = "search?q="+query;
		}
		return false;
	};

	this.hideNodes = function(jit,criteria){
		var match =true;
		$.each(jit.graph.nodes,function(index,item){
			match = true;
			$.each(criteria,function(key,val){
				if(item.data[key]==val){

				}else{
					match=false;
				}
			});
			if(match){
				jit.graph.nodes[item.id].setData('alpha', 0, 'end');
			}
		});
		jit.fx.animate({
          modes: ['node-property:alpha',
                  'edge-property:alpha'],
          duration: 500
        });
	};
	this.showNodes = function(jit,criteria){
		var match =true;
		$.each(jit.graph.nodes,function(index,item){
			match = true;
			$.each(criteria,function(key,val){
				if(item.data[key]==val){

				}else{
					match=false;
				}
			});
			if(match){
				jit.graph.nodes[item.id].setData('alpha', 1, 'end');
			}
		});
		jit.fx.animate({
          modes: ['node-property:alpha',
                  'edge-property:alpha'],
          duration: 500
        });
	};
	this.downloadImage = function(data){
		var f = document.createElement("form");
		f.setAttribute('method',"post");
		f.setAttribute('action',"index/downloadimage");

		var i = document.createElement("input"); //input element, text
		i.setAttribute('type',"hidden");
		i.setAttribute('name',"data");
		i.setAttribute('value',data);
		f.appendChild(i);
		f.submit();
	};
	this.refreshCiteGraph= function(fd,id,mode){
		$.get("citesgraph/ajax",{id:id,mode:mode},
			function(data,status,xhr){
			root = "node"+data.author.ID;
			json =[];
			var author={
				adjacencies:[],
				"data": {
					"$color": "#69C7EC",
					"$type": "square",
					"$dim": 10,
					"$label-size":14,
					"$label-color":"#FF0000",
					tipe:0,
					to: data.author.to,
					from: data.author.from
				},
				"id": "node"+data.author.ID,
				"name": data.author.NamaPengarang
			};
			var authordumps={};
			var color;
			var adjacencies,tofrom;
			$.each(data.authordumps,function(index,item){
				color =  "#C34918";
				authordumps={
					adjacencies:[],
					"data": {
						"$color": color,
						"$type": "square",
						"$dim": 8,
						"tipe" : item.type,
						to: item.to,
						from: item.from
					},
					"id": "node"+item.ID,
					"name": item.NamaPengarang
				};
				$.each(item.children, function(i,it){
					adjacencies={
						nodeTo: "node"+it.ID,
						nodeFrom: "node"+item.ID,
						data:{
							$color: defaultlinecolor
						}
					};
					authordumps.adjacencies.push(adjacencies);
				});
				json.push(authordumps);

				adjacencies={
					nodeTo: "node"+item.ID,
					nodeFrom: author.id,
					data:{
						$color:defaultlinecolor
						// $color: ("node"+it.ID==author.id || "node"+item.ID==author.id)?"#FD9827":defaultlinecolor
					}
				};
				author.adjacencies.push(adjacencies);
			});
			author.data.$color="#69C7EC";
			json.push(author);
			var noChildrenNodes={};
			$.each(data.noChildrenNodes,function(index,item){
				color =  "#C34918";
				noChildrenNodes={
					adjacencies:[],
					data:{
						$color:color,
						"$type": "square",
						"$dim": 8,
						"tipe": item.type
					},
					"id": "node"+item.ID,
					"name": item.NamaPengarang
				};
				json.push(noChildrenNodes);
			});
			fd.loadJSON(json);
			// compute positions incrementally and animate.  
			fd.root=root;
			fd.canvas.scale(1/fd.canvas.scaleOffsetX,1/fd.canvas.scaleOffsetY);
			fd.canvas.translate(-1*fd.canvas.translateOffsetX,-1*fd.canvas.translateOffsetY);
			fd.computeIncremental({
				iter: 40,
				property: 'end',
				onComplete: function(){
					fd.animate({
						modes: ['linear'],
						duration: 500,
						clearCanvas: true,
						onComplete:function(){
							var str = '<p><a href="pengarang?id='+data.author.ID+'">Detail Informasi Penulis</a></p><p>Daftar Publikasi</p><ul>';
							$.each(data.documents,function(index,item){
								str = str+"<li><a href='dokumen?id="+item.ID+"'>"+item.judul.trunc(80,true)+" ("+item.tahun+")</a></li>";
							});
							str = str+'</ul>';
							$("#leftSideBarGraph").html(str);
							$("#static-page .title").html("Grafik Sitasi dari "+data.author.NamaPengarang);
							$("#author-legend").html('<div class="author-legend">&nbsp;</div>'+ data.author.NamaPengarang);
							$("#MaskingGraph").hide();
						}
					});
					setTimeout(function(){
						if($("#MaskingGraph").css("display")!="none"){
							var str = '<p><a href="pengarang?id='+data.author.ID+'">Detail Informasi Penulis</a></p><p>Daftar Publikasi</p><ul>';
							$.each(data.documents,function(index,item){
								str = str+"<li><a href='dokumen?id="+item.ID+"'>"+item.judul.trunc(80,true)+" ("+item.tahun+")</a></li>";
							});
							str = str+'</ul>';
							$("#leftSideBarGraph").html(str);
							$("#static-page .title").html("Grafik Sitasi dari "+data.author.NamaPengarang);
							$("#author-legend").html('<div class="author-legend">&nbsp;</div>'+ data.author.NamaPengarang);
							fd.refresh();
							$("#MaskingGraph").hide();
						}
					},1000);
				}
			});
			// $('#graph .toolbar').off('change','input:radio[name="filtergraph"]');
		});
	};
}