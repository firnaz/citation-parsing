<?php
class UtilController extends Zend_Controller_Action
{
    public function indexAction()
    {
		$this->_helper->viewRenderer->setNoRender();
    }
    public function loginstatusAction()
    {
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$user_auth = new Zend_Session_Namespace('User_Auth_Simka_pu');
		$result['time'] = $user_auth->time; 
		$result['guid'] = $user_auth->guid; 
		$result['kduser'] = $user_auth->kduser; 
		$result['uname']= $user_auth->uname;
		$result['usertype'] = $user_auth->usertype;
		$result['kdunit'] = $user_auth->kdunit;
		echo Zend_Json::encode($result);
    }
	public function navigasiAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$user_auth = new Zend_Session_Namespace('User_Auth_Simka_pu');
		$content = "[
			{
				text:'Skripsi', 
				id: 'Dokumen',
				leaf:true
    		},{
				text:'Pengarang', 
				id: 'Pengarang',
				leaf:true
    		},{
				text:'Pustaka', 
				id: 'Pustaka',
				leaf:true
    		},{
				text:'Kesamaan Nama Pengarang', 
				id: 'PengarangIdentify',
				leaf:true
    		}";
		$content.= "]";
		echo $content;
	}
}
?>