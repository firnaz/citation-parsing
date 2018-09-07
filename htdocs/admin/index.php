<?php
defined('APPLICATION_PATH') || define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/../../app'));
defined('APPLICATION_ENV') || define('APPLICATION_ENV', (getenv('APPLICATION_ENV') ? getenv('APPLICATION_ENV') : 'production'));
define("DOCPARSER", realpath(APPLICATION_PATH."/../perl/docparser.pl"));
define("DOCPARSERTEST", realpath(APPLICATION_PATH."/../perl/docparsertest.pl"));
define("PDF2TEXT", realpath("/Library/Frameworks/Python.framework/Versions/2.7/bin/pdf2txt.py"));
define("PDFTOTEXT", realpath("/usr/local/bin/pdftotext"));
define("PDFDIR", realpath(APPLICATION_PATH."/../storage/pdf/"));
define("TXTDIR", realpath(APPLICATION_PATH."/../storage/txt/"));
define("TMPDIR", realpath(APPLICATION_PATH."/../storage/tmp/"));


set_include_path(implode(PATH_SEPARATOR, array(
	realpath(APPLICATION_PATH . '/../lib'),
	realpath(APPLICATION_PATH . '/../lib/rtf'),
	realpath(APPLICATION_PATH . '/../lib/OLE'),
	get_include_path(),
)));

require_once 'Zend/Application.php';
require_once 'Smarty/Smarty.class.php';

$application = new Zend_Application(APPLICATION_ENV,
	APPLICATION_PATH . '/config/admin.ini'
);

$application->bootstrap()->run();

