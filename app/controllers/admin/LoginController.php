<?php
class LoginController extends Zend_Controller_Action
{
    public function indexAction()
    {
		$this->_helper->layout->setLayout('login');    
    }
	public function loginAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$request 	= $this->getRequest();
		$uname = $request->getParam('loginUsername');
		$passwd = $request->getParam('loginPassword');

		$db = Zend_Registry::get('db');
		$authAdapter = new Zend_Auth_Adapter_DbTable($db,'t_user','username','password','MD5(?) AND status="0"');
		$authAdapter->setIdentity($uname)->setCredential($passwd);
		
		$auth = Zend_Auth::getInstance();
		$authenticate = $auth->authenticate($authAdapter);
		$data = $authAdapter->getResultRowObject(null,'password');
		$auth->getStorage()->write($data);
		
		if(!$authenticate->isValid()){
			$result["success"] = "false";
			$result["reason"] = "Username dan Password Salah!!!";
		}else{
			$user_auth = new Zend_Session_Namespace('User_Auth_tkidp');
			$user_auth->username=$auth->getIdentity()->username;
			$user_auth->usertype=$auth->getIdentity()->usertype;
			$user_auth->time= time();
			$result["success"] = "true";
		}
		echo Zend_Json::encode($result);			
	}
	public function logoutAction(){
		$auth  = Zend_Auth::getInstance();
	  	$auth->clearIdentity();
		Zend_Session::namespaceUnset("User_Auth_tkidp");
		$redirector = Zend_Controller_Action_HelperBroker::getStaticHelper('Redirector');         
		$redirector->gotoUrl('login');
	}
	public function cekloginAction(){
		if(!Zend_Auth::getInstance()->hasIdentity()){
			$result["login"] = "false";
		}else{
			$result["login"] = "true";
		}
		echo Zend_Json::encode($result);
	}
    public function loginstatusAction()
    {
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$user_auth = new Zend_Session_Namespace('User_Auth_tkidp');
		$result['username']= $user_auth->username;
		$result['usertype'] = $user_auth->usertype;
		echo Zend_Json::encode($result);
    }
}
?>
