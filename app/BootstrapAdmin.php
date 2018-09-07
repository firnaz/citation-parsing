<?php
class BootstrapAdmin extends Zend_Application_Bootstrap_Bootstrap
{

	protected function _initView()
    {
		$view = new Zend_View_Smarty(APPLICATION_PATH.'/views/admin',array("compile_dir"=>APPLICATION_PATH.'/views/templates_c'));
		$viewRenderer = new Zend_Controller_Action_Helper_ViewRenderer($view);
		$viewRenderer->setView($view)
					 ->setViewBasePathSpec($view->getEngine()->template_dir)
					 ->setViewScriptPathSpec(':controller/:action.:suffix')
					 ->setViewScriptPathNoControllerSpec(':action.:suffix')
					 ->setViewSuffix('phtml');
        Zend_Controller_Action_HelperBroker::addHelper($viewRenderer);
        Zend_Layout::startMvc(
            array(
                'layoutPath' => APPLICATION_PATH.'/views/admin/',
                'layout' => 'layout'
            )
        );
	}
	protected function _initLoader(){
		$loader = Zend_Loader_Autoloader::getInstance();
		$loader->setFallbackAutoloader(true);
		$loader->suppressNotFoundWarnings(false);
	}
	
	protected function _initFront(){
		Zend_Controller_Front::getInstance()->registerPlugin(new LayoutAdminPlugins());
		Zend_Controller_Action_HelperBroker::addHelper(new Tesis());
	}

	protected function _initDb()
    {
     	if(!Zend_Registry::isRegistered('db')){
			$config = new Zend_Config_Ini(APPLICATION_PATH . '/config/admin.ini', APPLICATION_ENV);
			$adapter = $config->resources->db->adapter;
			$params = $config->resources->db->params;

			$db = Zend_Db::factory($adapter, $params);
 
 			Zend_Db_Table_Abstract::setDefaultAdapter($db);
			Zend_Registry::set('db', $db);
		}else{
			$db = Zend_Registry::get('db');
			Zend_Db_Table_Abstract::setDefaultAdapter($db);
		}
    }
	public function _initRouter()
	{	
		$frontController = Zend_Controller_Front::getInstance();
		$config = new Zend_Config_Ini(APPLICATION_PATH . '/config/routeAdmin.ini');
		$router = $frontController->getRouter();
		$router->addConfig($config,'routes');					
	}
}
