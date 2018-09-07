<? 
class LayoutPlugins extends Zend_Controller_Plugin_Abstract
{
	public function preDispatch(Zend_Controller_Request_Abstract $request)
	{
		$config = new Zend_Config_Ini(APPLICATION_PATH . '/config/app.ini', APPLICATION_ENV);
		$layout = Zend_Controller_Action_HelperBroker::getStaticHelper('ViewRenderer');
		$view = $layout->view;
		$pages['obj'] = ucwords(Zend_Controller_Front::getInstance()->getRequest()->getControllerName());
		$pages['MD5'] = md5(date("YmdHis"));
		$view->_URL=$this->getRequest()->getBaseUrl();
		$view->pages = $pages;
		$view->layout = $layout; 	
		$view->_TITLE = $config->appTitle;
		$view->_SUBTITLE = $config->appSubTitle;
	}
}

?>