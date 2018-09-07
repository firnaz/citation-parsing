Ext.define('tkidp.Home.View',{
	requires :[
		'tkidp.Home.Action',
		'tkidp.Home.Data',
		'Ext.grid.*',
		'Ext.window.*'
	],
	Grid:null,
	Win:null,
	Action:null,
	Data:null,
	constructor:function(){
		var me = this;
		me.Action = new tkidp.Home.Action();
		me.Data = new tkidp.Home.Data();
		me.Grid = Ext.create('Ext.Panel', {
			
		});
	}
});