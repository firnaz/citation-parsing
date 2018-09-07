<?php 
class UserController extends Zend_Controller_Action
{
    public function indexAction()
    {
		$this->_helper->layout->setLayout('template');    
	}
	
	public function viewAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		extract($this->getRequest()->getParams());
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		
		if(!$dir) { $dir = 'ASC'; $sort='username';}	
		
		$user = new User();
		$data = $user->fetchAll($user->select()->where("username!='admin'")->order("$sort $dir")->limit($limit,$start));
		$total = $db->fetchRow($db->select()->from(array('t_user'),array('count(*) as total')));
		$data = count($data)?$data->toArray():array();
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}
	public function addAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		extract($this->getRequest()->getParams());

		$user = new User();
		$checkData = $user->fetchAll($user->select()->where("username='$username'"));
		if (count($checkData)==0){
			$row  = $user->createRow();
			$row->username 	= $username;
			$row->password 	= md5($password);
			$row->usertype 	= $tipeuser;
			$row->email 	= $email;
			$row->status 	= $status;
			$row->save();
			$result["success"] = "true";
		}else{
			$result["success"] = "false";
			$result["reason"] = "Username Sudah ada";
		}
		echo Zend_Json::encode($result);
	}
	function editAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		extract($this->getRequest()->getParams());

		$user = new User();

		$checkData = $user->fetchAll($user->select()->where("username='$username'"));		
		if ($password){
			$data['password']=md5($password);
		}else {
			$data['password']=$checkData[0]['password'];
		}
		$data['username'] =$username;
		$data['status'] = $status;
		$data['usertype'] = $tipeuser;
		$data['email'] =$email;
		
		$where = $user->getAdapter()->quoteInto('username= ?', $username);
		$user->update($data, $where);

		$result["success"] = "true";
		echo json_encode($result);
	}
	public function deleteAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$user = new User();
		$username =$this->getRequest()->getParam("ID");

		$where = $user->getAdapter()->quoteInto('username= ?', $username);
		$user->delete($where);
		$result["success"] = "true";
		echo json_encode($result);
	}
}

?>