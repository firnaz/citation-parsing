// JavaScript Document
Ext.define('tkidp.Store',{
	requires:[
		'Ext.data.JsonStore'
	],
	constructor: function(){
		var me = this;
		me.Pengarang =new Ext.data.JsonStore({
			proxy: {
				type: 'ajax',
				url: 'store/pengarang',
				reader: {
					type: 'json',
					root:'rows'
				}
			},
			fields:[
				{name: 'label_pengarang', type: 'string', mapping:'NamaPengarang'},
				{name: 'value_pengarang', type: 'string', mapping:'ID'}
			]
		});
	}
});
