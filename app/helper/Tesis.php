<?php
class Tesis extends Zend_Controller_Action_Helper_Abstract {
	private $organizationname =  "/\(.+\)|.* (inc|ltd)\.{0,1}$|.*(project|corporation|departemen|departement|universitas|university|company|pusat|center|centre|wikipedia|Kantor|GmbH|Commision|komisi|institut|institute|school|sekolah|badan|group|team|redaksi|\btim\b|consortium|konsorsium).*/i";
	private $partname = "/\b(den|op de|ten|ter|van|der|von|von|de)\b/i";
	public function pdf2txt($file){
		$filepdf = PDFDIR."/".$file;
		$filetxt = TXTDIR."/".$file;
		$strexec = PDFTOTEXT." -enc ASCII7  -raw ".$filepdf." ".$filetxt;
		exec($strexec);
		$content = "";
		$strexec = PDFTOTEXT." -enc ASCII7 -layout ".$filepdf." ".$filetxt."~layout";
		exec($strexec);
		if (file_exists($filetxt)){
			$content = file_get_contents($filetxt);
		}
		return $content;
	}
	public function citation_parser($file){

		$filetxt = TXTDIR."/".$file;
		$strexec = DOCPARSER." ".$filetxt;
		// echo $strexec;
		exec($strexec,$output);
		// error_log($strexec);
		return $output;
	}
	public function removeTitle($nama){
		$nama = trim($nama);
		$depan = trim(substr($nama, 0, strpos($nama,".")));
		$belakang = trim(substr($nama, strpos($nama,","),strlen($nama)-strpos($nama,",")));
		if(strlen($depan)>0 && in_array(strtolower($depan),array("ir","drs","dra","dr"))){
			$nama = substr($nama, strpos($nama,".")+1,strlen($nama)-(strpos($nama,".")+1));
		}
		if(strlen($belakang)>0 && strlen($nama)!=strlen($belakang)){
			$nama = substr($nama, 0,strpos($nama,","));
		}
		return $nama;
	}
	public function formatNamaPengarang($nama){
		if(preg_match($this->organizationname, $nama)){
			return $nama;
		}
		$nama = preg_replace("/ ([A-Z]) ([A-Z])$/", " $1$2", $nama);
		if(preg_match("/.* ([A-Z]+)$/", $nama)){
			return $nama;
		}
		$n = preg_split("/ /",trim($this->removeTitle($nama)));
		$fn = "";
		$ln = "";
		$last = array_pop($n);
		if(strlen($last)<=2 || preg_match("/^[A-Z]+$/", $last) || preg_match($this->partname, $last)){
			return $nama;
		}else{
			if(count($n)>0){
				$fn = $fn.$last;
				foreach($n as $key=>$val){
					if(preg_match($this->partname, $val,$match)){
						$ln = $ln." ".$match[1]." ";
					}else{
						$ln = $ln.strtoupper($val[0]);
					}
				}
				$fn = $fn." ".$ln;
				return $fn;
			}else{
				return $last;
			}
		}
	}
	public function parse_author($authors){
		if(preg_match($this->organizationname, $authors)){
			return array($authors);
		}
		if(preg_match('/^([A-Z][a-z]+),\s*([A-Z][a-z][A-Za-z]+)$/',$authors)){
			$authors = preg_replace('/^([A-Z][a-z]+),\s*([A-Z][a-z][A-Za-z]+)$/', '$2 $1', $authors);
		}
		$authors = str_replace(" dan "," & ",$authors);
		$authors = str_replace(" and "," & ",$authors);
		$a= explode("&",$authors);
		foreach ($a as $key=>$val){
			$val = trim($val);
			if(preg_match('/^([A-Z][a-z]+)\.,\s*([A-Z][a-z]+)$/',$val)){
				$val = preg_replace('/^([A-Z][a-z]+)\.,\s*([A-Z][a-z]+)$/', '$2 $1', $val);
			}
			$delimiter = ".,";
			$f  =  strpos($val,$delimiter);
			if ($f){
				$b = explode($delimiter,$val);
				foreach ($b as $key1=>$val1){
					$c = str_replace(","," ",$val1);
					$c = str_replace(".","",$c);
					$c = str_replace("  "," ",$c);
					$d[] = trim($c);
				}
			}else{
				$delimiter = ",";
				$f  =  strpos($val,$delimiter);
				if ($f){
					if(preg_match("/^([A-Z][a-z]+),\s*([A-Z][a-z]+)$/", $val)){
						$c = preg_replace('/^([A-Z][a-z]+),\s*([A-Z][a-z]+)$/', '$2 $1', $val);
					}else{
						$b = str_replace(".","",$val);
						$b = explode($delimiter,$b);
						$s="";
						$i=0;
						$c="";
						foreach($b as $val1){
							$s = str_replace(".","",trim($val1));
							$g = explode(" ",trim($s));
							if((strlen($s)<=2 && preg_match("/[A-Z][A-Z]*/", $s)) || preg_match("/\bet[\. ]+al\b|\bdkk\b/i",$s) || preg_match($this->partname,$s)){
								if (preg_match("/\bet[\. ]+al\b|\bdkk\b/i",$s)){
									// $c.=", et al.";
								}elseif (preg_match($this->partname,$s,$match)){
									$c.=" ".$match[1];
								}else{
									$c.=" ".$s;
								}
								$i++;
							}else{
								if($i){
									$g = explode(" ",trim($s));
									if(count($g)==1){
										$d[]=trim($c);
										$i=0;
									}else{
										$e = "";
										foreach($g as $val2){
											if(strlen($val2)<=2){
												$e.=" ".$val2;
											}else{
												$e="";
												break;
											}
										}
										if($e){
											$c.=" ".$e;
											$d[]=trim($c);
											$c="";
											$i=0;
											continue;
										}else{
											$d[]=trim($c);
											$i=0;
										}
									}
								}
								$c=$s;
								$i++;
							}
						}
					}
					if($c){
						$d[]=trim($c);
					}
				}else{
					$c = str_replace(".","",$val);
					$c = str_replace(",","",$c);
					$d[]=trim($c);			
				}
			}
		}
		return $d;
	}
	public function get_authors($docid){
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$sql = "select a.ID,a.NamaPengarang from Pengarang a JOIN DokumenPengarang b ON (a.ID=b.PengarangID) where b.DokumenID='$docid' order by b.urutan ASC";
		$authors = $db->fetchAll($sql);
		$s= array();
		foreach ($authors as $key=>$val){
			$s[$val['ID']] = $val['NamaPengarang'];
		}
		return $s;
	}
	public function merge_authors($authors= array(),$before="",$after=""){
		$merge = "";
		$count = count($authors);
		if($count<=1){
			foreach($authors as $key=>$author){
				$b = preg_replace('/\{([A-Za-z]+)\}/e', "$$1", $before);
				$a = preg_replace('/\{([A-Za-z]+)\}/e', "$$1", $after);
				$merge = $b.$author.$a;
			}
		}else{
			$i=1;
			foreach($authors as $key=>$author){
				// if($i==$count){
				// 	$merge = substr($merge, 0,-2);
				// 	$merge .= " & ".$author; 
				// }else{
					$b = preg_replace('/\{([A-Za-z]+)\}/e', "$$1", $before);
					$a = preg_replace('/\{([A-Za-z]+)\}/e', "$$1", $after);
					$merge .= $b.$author.$a.", ";
				// }
				$i++;
			}
			$merge = substr($merge, 0,-2);
		}
		return $merge;
	}
	public function checkdoc($authors,$judul,$tahun){
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		// $sql = "select *, levenshtein(".$db->quote($judul).", judul)/length(".$db->quote($judul).") as jarak_levenstein from  Dokumen where levenshtein(".$db->quote($judul).", judul)/length(".$db->quote($judul).")<0.1";
		$sql = "select ID, judul, tahun, penerbit from Dokumen where tahun='$tahun'";
		// echo $sql;exit;
		// error_log($sql);
		$docs = $db->fetchAll($sql);

		$author1 = $this->merge_authors($authors);
		$sim = array();
		foreach ($docs as $key=>$doc){
			$docid = $doc['ID'];
			$lev = levenshtein(strtolower($doc["judul"]), strtolower($judul))/strlen($judul);
			if($lev>0.1){
				continue;
			}
			$author2 =  $this->merge_authors($this->get_authors($docid));
			$lev = levenshtein($author1, $author2);
			if($lev>2){
				continue;
			}
			// $lev = levenshtein($doc['tahun'], $tahun);
			// if($lev>1){
			// 	continue;
			// }
			$sim[] = $doc;
		}
		return $sim;
	}
	function is_author_name($str){
		$pattern = array("/^inc/i");
		foreach($pattern as $val){
			if(preg_match($val, $str)){
				return 1;
			}

		}
		return 0;
	}
	public function saveDoc($tipe,$DokumenID,$data){
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$sql = "DELETE from Website where ID='$DokumenID'";
		$db->query($sql);

		$sql = "DELETE from Jurnal where ID='$DokumenID'";
		$db->query($sql);

		$sql = "DELETE from Prosiding where ID='$DokumenID'";
		$db->query($sql);
		extract($data);
		$sql = "";

		if($tipe=="website"){
			$sql = "INSERT INTO Website (ID,url) values ('$DokumenID','$url')";
		}elseif($tipe=="jurnal"){
			$sql = "INSERT INTO Jurnal (ID,nama_jurnal,volume,halaman) values ('$DokumenID','$nama_jurnal','$volume','$halaman')";
		}elseif($tipe=="prosiding"){
			$sql = "INSERT INTO Prosiding (ID,nama_prosiding,lokasi,tanggal) values ('$DokumenID','$nama_prosiding','$lokasi','$tanggal')";
		}
		if($sql){
			$db->query($sql);
		}
	}
	public function savePengarang($DokumenID,$PengarangIDs){
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$dokumenpengarang = new Dokumenpengarang();
		$where = $dokumenpengarang->getAdapter()->quoteInto('DokumenID= ?', $DokumenID);
		$dokumenpengarang->delete($where);
		$i=1;
		foreach($PengarangIDs as $PengarangID){
			$row = $dokumenpengarang->createRow();
			$row->DokumenID = $DokumenID;
			$row->PengarangID = $PengarangID;
			$row->urutan = $i;
			$row->save();
			$i++;
		}
	}
	public function getPengarangID($DokumenID){
		$dokumenpengarang = new Dokumenpengarang();
		$PengarangIDs= $dokumenpengarang->fetchAll("DokumenID='$DokumenID'");

		$arr = array();
		foreach($PengarangIDs as $PengarangID){
			$arr[] = $PengarangID->PengarangID; 
		}
		return $arr;
	}
	function character_limiter($str, $n = 500)
	{
	    if (strlen($str) < $n)
	    {
	        return $str;
	    }

	    $str = preg_replace("/\s+/", ' ', str_replace(array("\r\n", "\r", "\n"), ' ', $str));

	    if (strlen($str) <= $n)
	    {
	        return $str;
	    }

	    $out = "";
	    foreach (explode(' ', trim($str)) as $val)
	    {
	        $out .= $val.' ';

	        if (strlen($out) >= $n)
	        {
	            $out = trim($out);
	            return $out;
	        }
	    }
	 }
	 function highlightString($text, $words){
		$wordsArray = array();
		$markedWords = array();
		// explode the phrase in words
		if(!is_array($words)){
			$wordsArray = explode(' ', $words); 			
		}else{
			$wordsArray = $words;
		}

		foreach($wordsArray as $w){
			$word = preg_quote($w);
			$text = preg_replace("/\b($word)\b/i", '<span class="highlight_result">\1</span>', $text);
		}
		return $text;
	 }
	 function highlightedSummary($str, $word, $n = 500){
	 	$first_pos = strpos($str,$word);
	 	$output="";
	 	if ($first_pos !== false) {
         	$output = substr($str,max(0,$first_pos - 100),$n + strlen($word));
	    }
	    return $output;
	 }

	 function summary($str,$word, $n = 500){
	 	if(is_array($word)){
	 		foreach($word as $val){
			 	$summary = $this->highlightedSummary($str,$val,$n);
			 	break;
	 		}
	 	}else{
	 		$summary = $this->highlightedSummary($str,$word,$n);
	 	}
	 	if($summary){
	 		$summary = str_replace("\n"," ",$this->character_limiter($str,$n));
	 		return $this->highlightString($summary,$word);
	 	}else{
	 		$summary = str_replace("\n"," ",$this->character_limiter($str,$n));
	 		return $summary;
	 	}
	 }

	 function getCoAuthorNodes($id, $documents, $level, &$authors){
	 	$p=array();
		$authordumps = array();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
    	//pengarang satu dokumen
    	foreach($documents as $key=>$row){
    		$wherenotin = count($p)?"AND Pengarang.ID not in (".implode(",",$p).")":"";
    		$sql = "SELECT Pengarang.ID, 
						Pengarang.NamaPengarang
					FROM Pengarang INNER JOIN DokumenPengarang ON Pengarang.ID = DokumenPengarang.PengarangID
						 INNER JOIN Dokumen ON DokumenPengarang.DokumenID = Dokumen.ID where PengarangID!='$id' 
						 AND DokumenPengarang.DokumenID='".$row['DokumenID']."' $wherenotin LIMIT 0,5";
			$rows = $db->fetchAll($sql);
			if(count($rows)>0){
				foreach($rows as $k=>$v){
					$rows[$k]['type'] = '1';
					if($level>1){
						$rows[$k]['children']= $this->getCoAuthorNodesFromAuthors($v,$level-1,$authors);
					}
					$p[] = $v['ID'];
				}
				$authordumps = array_merge($authordumps,$rows);
			}
    	}
    	//pengarang dokumen sumber
   //  	foreach($documents as $key=>$row){
   //  		$wherenotin = count($p)?"AND Pengarang.ID not in (".implode(",",$p).")":"";
   //  		$sql = "SELECT Pengarang.ID, 
			// 				Pengarang.NamaPengarang
			// 			FROM Pengarang INNER JOIN DokumenPengarang ON Pengarang.ID = DokumenPengarang.PengarangID
			// 				 INNER JOIN Dokumen ON DokumenPengarang.DokumenID = Dokumen.ID
			// 				 INNER JOIN Pustaka ON Dokumen.ID = Pustaka.DokumenID
	 	// 				 where PengarangID!='$id' 
			// 			 AND Pustaka.DokumenSumberID='".$row['DokumenID']."' $wherenotin LIMIT 0,5";
			// $rows = $db->fetchAll($sql);
			// if(count($rows)>0){
			// 	foreach($rows as $k=>$v){
			// 		$rows[$k]['type'] = '2';
			// 		if($level>1){
			// 			$rows[$k]['children']= $this->getNodesFromAuthors($v,$level-1,$authors);
			// 		}
			// 		$p[] = $v['ID'];
			// 	}
			// 	$authordumps = array_merge($authordumps,$rows);
			// }
   //  	}

    	//pengarang dokumen diacu
   //  	foreach($documents as $key=>$row){
   //  		$wherenotin = count($p)?"AND Pengarang.ID not in (".implode(",",$p).")":"";
   //  		$sql = "SELECT Pengarang.ID, 
			// 				Pengarang.NamaPengarang
			// 			FROM Pengarang INNER JOIN DokumenPengarang ON Pengarang.ID = DokumenPengarang.PengarangID
			// 				 INNER JOIN Dokumen ON DokumenPengarang.DokumenID = Dokumen.ID
			// 				 INNER JOIN Pustaka ON Dokumen.ID = Pustaka.DokumenSumberID
	 	// 				 where PengarangID!='$id' 
			// 			 AND Pustaka.DokumenID='".$row['DokumenID']."' $wherenotin LIMIT 0,5";
			// $rows = $db->fetchAll($sql);
			// if(count($rows)>0){
			// 	foreach($rows as $k=>$v){
			// 		$rows[$k]['type'] = '3';
			// 		if($level>1){
			// 			$rows[$k]['children']= $this->getNodesFromAuthors($v,$level-1,$authors);
			// 		}
			// 		$p[] = $v['ID'];
			// 	}
			// 	$authordumps = array_merge($authordumps,$rows);
			// }
   //  	}
		return $authordumps;
	 }
	 function getCoAuthorNodesFromAuthors($author,$level,&$authors){
		$authordumps = array();
		$p = array();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();

		//pengarang satu dokumen
		foreach($author as $key=>$row){
			$wherenotin = count($p)?"AND Pengarang.ID not in (".implode(",",$p).")":"";
			$sql = "SELECT Pengarang.ID, 
						Pengarang.NamaPengarang
					FROM Pengarang INNER JOIN DokumenPengarang ON Pengarang.ID = DokumenPengarang.PengarangID
						 INNER JOIN Dokumen ON DokumenPengarang.DokumenID = Dokumen.ID where 
						 PengarangID=".$author["ID"]." $wherenotin LIMIT 0,5";
			$rows = $db->fetchAll($sql);
			if(count($rows)>0){
				foreach($rows as $k=>$v){
					if($v["ID"]!=$author["ID"]){
						$rows[$k]['type'] = '1';
						if($level>1){
							$rows[$k]['children']= $this->getCoAuthorNodesFromAuthors($v,$level-1,$authors);
						}
						$p[] = $v['ID'];
					}
				}
				$authordumps = array_merge($authordumps,$rows);
			}
		}
		return $authordumps;
	}
	 function getCiteNodes(&$author, $documents, $level, &$authors, $mode=0){
	 	// $p=array();
	 	$author["to"] = array();
	 	$author["from"] = array();
		$authordumps = array();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		if($mode==0){
			$limit=5;
		}else{
			$limit=10;
		}
		// echo $limit;exit;
    	//pengarang dokumen sumber
    	if($mode==0 || $mode==1){
	    	foreach($documents as $key=>$row){
	    		$wherenotin = count($authors)?"AND Pengarang.ID not in (".implode(",",$authors).")":"";
	    		$sql = "SELECT DISTINCT Pengarang.ID, 
								Pengarang.NamaPengarang
							FROM Pengarang INNER JOIN DokumenPengarang ON Pengarang.ID = DokumenPengarang.PengarangID
								 INNER JOIN Dokumen ON DokumenPengarang.DokumenID = Dokumen.ID
								 INNER JOIN Pustaka ON Dokumen.ID = Pustaka.DokumenID
		 					 where PengarangID!=".$author["ID"]." AND Pustaka.DokumenSumberID='".$row['DokumenID']."' 
		 					 $wherenotin LIMIT 0,$limit";
				$rows = $db->fetchAll($sql);
				if(count($rows)>0 && count($author["to"])<$limit){
					foreach($rows as $k=>$v){
						$authors[] = $v['ID'];
						$author["to"][] = "node".$v['ID'];
						$rows[$k]['type'] = '2';
						$rows[$k]['to']= array();
						if($level>1){
							$rows[$k]['children']= $this->getCiteNodesFromAuthors($rows[$k],$level-1,$authors);
						}
					}
					$authordumps = array_merge($authordumps,$rows);
				}
	    	}
    	}
    	//pengarang dokumen diacu
    	if($mode==0 || $mode==2){
	    	foreach($documents as $key=>$row){
	    		$wherenotin = count($authors)?"AND Pengarang.ID not in (".implode(",",$authors).")":"";
	    		$sql = "SELECT DISTINCT Pengarang.ID, 
								Pengarang.NamaPengarang
							FROM Pengarang INNER JOIN DokumenPengarang ON Pengarang.ID = DokumenPengarang.PengarangID
								 INNER JOIN Dokumen ON DokumenPengarang.DokumenID = Dokumen.ID
								 INNER JOIN Pustaka ON Dokumen.ID = Pustaka.DokumenSumberID
		 					 where PengarangID!=".$author["ID"]." AND Pustaka.DokumenID='".$row['DokumenID']."' 
		 					 $wherenotin LIMIT 0,$limit";
				$rows = $db->fetchAll($sql);

				if(count($rows)>0 && count($author["from"])<$limit){
					foreach($rows as $k=>$v){
						$authors[] = $v['ID'];
						$author["from"][] = "node".$v['ID'];
						$rows[$k]['type'] = '3';
						if($level>1){
							$rows[$k]['children']= $this->getCiteNodesFromAuthors($rows[$k],$level-1,$authors);
						}
					}
					// print_r($rows);exit;
					$authordumps = array_merge($authordumps,$rows);
				}
	    	}
    	}
		// print_r($authordumps);exit;
		return $authordumps;
	 }
	 function getCiteNodesFromAuthors(&$author,$level,&$authors){
	 	$author["to"] = array();
	 	$author["from"] = array();
		$authordumps = array();
		//$p = array($author["ID"]);
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();

   	//pengarang dokumen sumber
    	// foreach($author as $key=>$row){
    		$wherenotin = count($authors)?"AND a.ID not in (".implode(",",$authors).")":"";
    		$sql = "SELECT DISTINCT a.ID, 
						a.NamaPengarang
						FROM Pengarang a 
						INNER JOIN DokumenPengarang b on b.PengarangID=a.ID
						INNER JOIN Dokumen c on b.DokumenID=c.ID
						INNER JOIN Pustaka d on d.DokumenID=c.ID
						INNER JOIN Dokumen e on e.ID = d.DokumenSumberID
						INNER JOIN DokumenPengarang f on f.DokumenID=e.ID
						INNER JOIN Pengarang g on g.ID= f.PengarangID
						where g.ID=".$author["ID"]." $wherenotin LIMIT 0,4";
			$rows = $db->fetchAll($sql);
			if(count($rows)>0){
				foreach($rows as $k=>$v){
					$authors[] = $v['ID'];
					$rows[$k]['type'] = '2';
					$author["to"][] = "node".$v['ID'];
					if($level>1){
						$rows[$k]['children']= $this->getCiteNodesFromAuthors($rows[$k],$level-1,$authors);
					}
				}
				$authordumps = array_merge($authordumps,$rows);
			}
    	// }

    	// exit;
    	//pengarang dokumen diacu
    	// foreach($author as $key=>$row){
    		$wherenotin = count($authors)?"AND a.ID not in (".implode(",",$authors).")":"";
    		$sql = "SELECT DISTINCT a.ID, 
						a.NamaPengarang
						FROM Pengarang a 
						INNER JOIN DokumenPengarang b on b.PengarangID=a.ID
						INNER JOIN Dokumen c on b.DokumenID=c.ID
						INNER JOIN Pustaka d on d.DokumenSumberID=c.ID
						INNER JOIN Dokumen e on e.ID = d.DokumenID
						INNER JOIN DokumenPengarang f on f.DokumenID=e.ID
						INNER JOIN Pengarang g on g.ID= f.PengarangID
						where g.ID=".$author["ID"]." $wherenotin LIMIT 0,4";
			$rows = $db->fetchAll($sql);
			if(count($rows)>0){
				foreach($rows as $k=>$v){
					$authors[] = $v['ID'];
					$rows[$k]['type'] = '3';
					$author["from"][] = "node".$v['ID'];
					if($level>1){
						$rows[$k]['children']= $this->getCiteNodesFromAuthors($rows[$k],$level-1,$authors);
					}
				}
				$authordumps = array_merge($authordumps,$rows);
			}
    	// }
		return $authordumps;
	}
	public function withChildrenNodes($authors,&$withChildrenNodes){
		foreach($authors as $author){
			if($author["children"] && is_array($author["children"]) && count($author["children"])>0){
				if(!in_array($author["ID"],$withChildrenNodes)){
					$withChildrenNodes[] = $author["ID"];
				}
				$this->withChildrenNodes($author["children"],$noChildrenNodes);
			}
		}
	}
	public function noChildrenNodes($authors,&$noChildrenNodes,&$withChildrenNodes){
		foreach($authors as $author){
			if($author["children"] && is_array($author["children"]) && count($author["children"])>0){
				$this->noChildrenNodes($author["children"],$noChildrenNodes,$withChildrenNodes);
			}else{
				if(!in_array($author["ID"],$withChildrenNodes)){
					$withChildrenNodes[] = $author["ID"];
					$noChildrenNodes[] = $author;
				}
			}
		}
	}

	public function emptydirectory($dir){
		$files = glob($dir.'/*'); // get all file names
		foreach($files as $file){ // iterate files
		  if(is_file($file))
		    unlink($file); // delete file
		}		
	}
	function array_sort_by_column(&$arr, $col, $dir = SORT_ASC) {
	    $sort_col = array();
	    if (is_array($arr)){
		    foreach ($arr as $key=> $row) {
		        $sort_col[$key] = $row[$col];
		    }
		    array_multisort($sort_col, $dir, $arr);
		}
	}
}
?>