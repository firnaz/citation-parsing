// JavaScript Document
Ext.BLANK_IMAGE_URL = "images/default/s.gif";

Ext.Loader.setConfig({enabled:true});

Ext.Loader.setPath({
    'tkidp': 'js/app',
    'tkidp.User': 'js/app/User',
	'Ext.ux': 'js/ext/ux'
});

Ext.require([
	'Ext.ux.panel.PDF',
	'Ext.Loader',
	'Ext.dom',
	'Ext.Ajax',
	'Ext.JSON',
	'Ext.ux.util',
	'Ext.form.field.ComboBox',
	'tkidp.Layout',
	'tkidp.Util',
	'tkidp.Store'
]);

Ext.onReady(function() {
	Ext.namespace('app');
	Ext.Loader.setConfig({enabled:true});
	Ext.Ajax.request({
		url: 'login/loginstatus',
		callback: function(option, success, response){
			var result = Ext.JSON.decode(response.responseText);
			app.kduser = result.username;
			app.time = result.time;
			app.usertype = result.usertype;
			//app.LoadingMask = Ext.dom.Element.mask(Ext.getBody(), {msg:"Sedang Memproses...",id:'loadMask'});
			if(!app.kduser || !app.usertype){
				window.location.href="login";
			}else{
				app.Session = result;
				app.Layout = new tkidp.Layout();
				app.Util = new tkidp.Util();
				app.Store = new tkidp.Store();
			}
			Ext.removeNode(document.getElementById('loading'));
		}
	});
});
