<? 
class PasswordController extends Zend_Controller_Action
{
    public function indexAction()
    {
		$this->_helper->layout->setLayout('template');    
	}
	function changepasswordAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$user_auth = new Zend_Session_Namespace('User_Auth_tkidp');
		$user = new User();
		extract($this->getRequest()->getParams());
		
		$ID = $user_auth->username;
		$data['password'] = md5($PASSWORD);
		$where = $user->getAdapter()->quoteInto('username= ?', $ID);
		$user->update($data, $where);
		$result["success"] = "true";				
		echo json_encode($result);
	}
}
?>