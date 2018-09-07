#!/usr/bin/perl

use utf8;
#use lib "lib/";
#use lib "../../..";
#use lib "/Users/nanaz/www/tesis/perl/lib";
use Cwd 'abs_path';
use File::Basename;
use Data::Dumper;
use lib dirname(abs_path $0);
 
use Biblio::Document::Parser::Standardtest;
use Biblio::Document::Parser::Utils;
use Biblio::Document::Parser::Brody;
use Biblio::Citation::Parser::StandardTest;
use Biblio::Citation::Parser::Citebase;
use Biblio::Citation::Parser::Utils;
use Biblio::Document::Parser::Utils qw( normalise_multichars );
use Term::ANSIColor;

binmode(STDERR, ":utf8");
binmode(STDOUT, ":utf8");

if (scalar @ARGV != 1)
{
	print STDERR "Usage: $0 <filename>\n";
	exit;
}

my $cit_parser = new Biblio::Citation::Parser::StandardTest;
my $doc_parser = new Biblio::Document::Parser::Standardtest;

#print "Parsed using Biblio::Citation::Parser::Standard\n\n";

#parse_document($doc_parser,$cit_parser);

#print "Parsed using Biblio::Citation::Parser::Citebase\n\n";

# $cit_parser = new Biblio::Citation::Parser::Citebase;
parse_document($doc_parser,$cit_parser);

sub parse_document {
	my ($doc_parser,$cit_parser) = @_;
	my $content = get_content($ARGV[0]);
	my $layout = get_content($ARGV[0]."~layout");
	my @references = $doc_parser->parse($content,$layout);
	#print @references;
	foreach $reference (@references)
	{
		$metadata = $cit_parser->parse($reference);
		if(!$metadata){
		}else{
			# $Data::Dumper::Useqq = 1;          # print strings in double quotes
#			print Dumper($metadata);
#			print color("green");
			$location = create_openurl($metadata);
				#color("red"), "$reference\n", color("reset"),
			print "<raw>$metadata->{ref}</raw><match>$metadata->{match}</match><runtime>$metadata->{runtime}</runtime><type>$metadata->{key}</type>$metadata->{marked}\n";
#			print color("reset");
		}
	}
}
