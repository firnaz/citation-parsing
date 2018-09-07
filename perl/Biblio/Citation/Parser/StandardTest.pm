package Biblio::Citation::Parser::StandardTest;

######################################################################
#
# Biblio::Citation::Parser::Standard;
#
######################################################################
#
#  This file is part of ParaCite Tools (http://paracite.eprints.org/developers/)
#
#  Copyright (c) 2004 University of Southampton, UK. SO17 1BJ.
#
#  ParaTools is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  ParaTools is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with ParaTools; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#
######################################################################

require Exporter;
@ISA = ("Exporter", "Biblio::Citation::Parser");

use strict;
use Data::Dumper;
use Regexp::Optimizer;
use Encode qw( from_to is_utf8 );

use Biblio::Citation::Parser::Templates;
our @EXPORT_OK = ( 'parse', 'new' );


=pod

=head1 NAME

B<Biblio::Citation::Parser::Standard> - citation parsing functionality

=head1 SYNOPSIS

  use Biblio::Citation::Parser::Standard;
  # Parse a simple reference
  $parser = new Biblio::Citation::Parser::Standard;
  $metadata = $parser->parse("M. Jewell (2004) Citation Parsing for Beginners. Journal of Madeup References 4(3).");
  print "The title of this article is ".$metadata->{atitle}."\n";

=head1 DESCRIPTION

Biblio::Citation::Parser::Standard uses a relatively simple template matching
technique to extract metadata from citations.

The Templates.pm module currently provides almost 400 templates, with
more being added regularly, and the parser returns the metadata in a
form that is easily massaged into OpenURLs (see the Biblio::OpenURL
module for an even easier way).

=cut


my %factors =
(
	"_AUFIRST_"	=> 0.6,
	"_AULAST_"	=> 0.6,
	"_ISSN_"	=> 0.95, 
	"_AUTHORS_"	=> 0.65,
	"_EDITOR_"	=> 0.9,
	"_DATE_"	=> 0.95,
	"_YEAR_" 	=> 0.65,
	"_SUBTITLE_" 	=> 0.65,
	"_TITLE_" 	=> 0.65,
	"_EDITORTITLE_" 	=> 0.65,
	"_EDISI_" 	=> 0.7,
	"_UCTITLE_" 	=> 0.7,
	"_CAPTITLE_"	=> 0.7,
	"_PUBLICATION_" => 0.9,
	"_PUBLISHER_" 	=> 0.65,
	"_PUBLOC_" 	=> 0.65,
	"_UCPUBLICATION_" => 0.74,
	"_CAPPUBLICATION_"	=> 0.7, 
	"_CHAPTER_" 	=> 0.8,
	"_VOLUME_" 	=> 0.9,
	"_ISSUE_" 	=> 0.9,
	"_PAGES_" 	=> 0.9,
	"_ANY_" 	=> 0.1,
	"_ISBN_"	=> 0.95,
	"_ISSN_"	=> 0.95,
	"_SPAGE_"	=> 0.8,
	"_EPAGE_"	=> 0.8,
	"_URL_"		=> 0.9,
	"_EDISI_"	=> 0.9,
);

# my %matches = ();
=pod

=head1 METHODS

=over 4

=item $parser = Biblio::Citation::Parser::Standard-E<gt>new()

The new() method creates a new parser. 

=cut


sub new
{
	my($class) = @_;
	my $self = {};
	return bless($self, $class);
}

=pod

=item $reliability = Biblio::Citation::Parser::Standard::get_reliability($template)

The get_reliability method returns a value that acts as an indicator
of the likelihood of a template matching correctly. Fields such as
page ranges, URLs, etc, have high likelihoods (as they follow rigorous
patterns), whereas titles, publications, etc have lower likelihoods.

The method takes a template as a parameter, but you shouldn't really
need to use this method much.

=cut

sub get_reliability
{
	# print "get_reliability\n";
	my( $template ) = @_;
	my $reliability = 0;
	foreach(keys %factors)
	{
		if ($template =~ /$_/)
		{
			while($template =~ /$_/)
			{
				$reliability += $factors{$_};
				$template =~ s/$_//;	
			}
		}
	}
	return $reliability;
}

=pod

=item $concreteness = Biblio::Citation::Parser::Standard::get_concreteness($template)

As with the get_reliability() method, get_concreteness() takes
a template as a parameter, and returns a numeric indicator. In
this case, it is the number of non-field characters in the template.
The more 'concrete' a template, the higher the probability that
it will match well. For example, '_PUBLICATION_ Vol. _VOLUME_' is
a better match than '_PUBLICATION_ _VOLUME_', as _PUBLICATION_ is
likely to subsume 'Vol.' in the second case.

=cut

sub get_concreteness
{
	# print "get_concreteness\n";
	my( $template ) = @_;
	my $concreteness = 0;
	foreach(keys %factors)
	{
		$template =~ s/$_//g;
	}	
	return length($template);
}

=pod

=item $string = Biblio::Citation::Parser::Standard::strip_spaces(@strings)

This is a helper function to remove spaces from all elements
of an array.

=cut

sub strip_spaces
{	
	# print "strip_spaces\n";
	my(@bits) = @_;
	foreach(@bits) { s/^[[:space:]]*(.+)[[:space:]]*$/$1/;}
	return @bits;
}

=pod

=item $templates = Biblio::Citation::Parser::Standard::get_templates()

Returns the current template list from the Biblio::Citation::Parser::Templates
module. Useful for giving status lists.

=cut

sub get_templates
{
	return $Biblio::Citation::Parser::Templates::templates;
}

=pod

=item @authors = Biblio::Citation::Parser::Standard::handle_authors($string)

This (rather large) function handles the author fields of a reference.
It is not all-inclusive yet, but it is usably accurate. It can handle
author lists that are separated by semicolons, commas, and a few other
delimiters, as well as &, and, and 'et al'.

The method takes an author string as a parameter, and returns an array
of extracted information in the format '{family => $family, given =>
$given}'.

=cut 

sub handle_authors
{
	# print "handle_authors\n";	
	my($authstr) = @_;
	
	my @authsout = ();
	$authstr =~ s/\bet al\b//;
	# Handle semicolon lists
	if ($authstr =~ /;/)
	{
		my @auths = split /[[:space:]]*;[[:space:]]*/, $authstr;
		foreach(@auths)
		{
			my @bits = split /[,[:space:]]+/;
			@bits = strip_spaces(@bits);
			push @authsout, {family => $bits[0], given => $bits[1]};
		}
	}
	elsif ($authstr =~ /^[[:upper:]\.]+[[:space:]]+[[:alnum:]]/)
	{
		my @bits = split /[[:space:]]+/, $authstr;
		@bits = strip_spaces(@bits);
		my $fam = 0;
		my($family, $given);
		foreach(@bits)
		{
			next if ($_ eq "and" || $_ eq "&" || /^[[:space:]]*$/);
			s/,//g;
			if ($fam)
			{
				$family = $_;
				push @authsout, {family => $family, given => $given};
				$fam = 0;
			}
			else
			{
				$given = $_;
				$fam = 1;
			}
		}
	}
	elsif ($authstr =~ /^.+[[:space:]]+[[:upper:]\.]+/)
	{
		# Foo AJ, Bar PJ
		my $fam = 1;
		my $family = "";
		my $given = "";
		my @bits = split /[[:space:]]+/, $authstr;
		@bits = strip_spaces(@bits);
		foreach(@bits)
		{
			s/[,;\.]//g;
			s/\bet al\b//g;
			s/\band\b//;
			s/\b&\b//;
			next if /^[[:space:]]*$/;
			if ($fam == 1)
			{
				$family = $_;
				$fam = 0;
			}
			else
			{
				$given = $_;
				$fam = 1;
				push @authsout, {family => $family, given => $given};
				
			}
		}
	} 
	elsif ($authstr =~ /^.+,[[:space:]]*.+/ || $authstr =~ /.+\band\b.+/)
	{
		my $fam = 1;
		my $family = "";
		my $given = "";
		my @bits = split /[[:space:]]*,|\band\b|&[[:space:]]*/, $authstr;
		@bits = strip_spaces(@bits);
		foreach(@bits)
		{
			next if /^[[:space:]]*$/;
			if ($fam)
			{
				$family = $_;
				$fam = 0;	
			}
			else
			{
				$given = $_;
				push @authsout, {family => $family, given => $given};
				$fam = 1;
			}
		}
	}
	elsif ($authstr =~ /^[[:alpha:][:space:]]+$/)
	{
		$authstr =~ /^([[:alpha:]]+)[[:space:]]*([[:alpha:]]*)$/;
		my $given = "";
		my $family = "";
		if (defined $1 && defined $2)
		{
			$given = $1;
			$family = $2;
		}
		if (!defined $2 || $2 eq "")
		{
			$family = $1;
			$given = "";
		}
		push @authsout, {family => $family, given => $given};
	}
	elsif( $authstr =~ /[[:word:]]+[[:space:]]+[[:word:]]?[[:space:]]*[[:word:]]+/)
	{
		my @bits = split /[[:space:]]+/, $authstr;
		my $rest = $authstr;
		$rest =~ s/$bits[-1]//;
		push @authsout, {family => $bits[-1], given => $rest};
	}
	else
	{
		
	}
	return @authsout;
}

=pod

=item %metadata = $parser-E<gt>xtract_metadata($reference)

This is the key method in the Standard module, although it is not actually
called directly by users (the 'parse' method provides a wrapper). It takes
a reference, and returns a hashtable representing extracted metadata.

A regular expression map is present in this method to transform '_AUFIRST_',
'_ISSN_', etc, into expressions that should match them. The method then
finds the template which best matches the reference, picking the result that
has the highest concreteness and reliability (see above), and returns the
fields in the hashtable. It also creates the marked-up version, that is
useful for further formatting. 

=cut 

sub extract_metadata
{
	my($self, $ref) = @_;
	$ref=trim($ref);
	my $start_run = time();
	my $ro  = Regexp::Optimizer->new();
	if($ref !~ /\.$/){
		$ref=$ref.".";
	}
	$ref=~ s/^\s*(.+)\s*$/$1/;
	# Skip to the first Alpha char
	# if ($ref !~ /^[[:digit:]]-X\.]+$/) { $ref =~ s/^[^[:alpha:][:digit:]]+//; }
	$ref =~ s/[[:space:]\*]+$//;
	$ref =~ s/[[:space:]]{2}[[:space:]]+/ /g;
	$ref =~ s/^[[:space:]\*]*(.+)[[:space:]\*]*$/$1/;
	print $ref."\n";
	my %metaout = ();
	$metaout{ref} = $ref;

	$metaout{id} = [];
        # Pull out doi addresses
	if ($ref =~ s/doi:(.+)\b//)
	{
		push @{$metaout{id}}, "doi:$1";
	}	
	if ($ref =~ s/((astro-ph|cond-mat|gr-qc|hep-ex|hep-lat|hep-ph|hep-th|math-th|nucl-ex|nucl-th|physics|quant-ph|math|nlin|cs)\/\d+\b)//)
	{
		push @{$metaout{id}}, "arxiv:$1";
	}
	my @specific_pubs =
	(
		"\\b.*\\b[Tt][Rr][Aa][Ii][Nn][Ii][Nn][Gg]\\b.*\\b",
		"\\b.*\\b[Cc][Oo][Nn][Ff][Ee][Rr][Ee][Nn][Cc][Ee]\\b.*\\b",
		"\\b.*\\b[Ss][Yy][Mm][Pp][Oo][Ss][Ii][Uu][Mm]\\b.*\\b",
		"\\b.*\\b[Ww][Oo][Rr][Kk][Ss][Hh][Oo][Pp]\\b.*\\b",
		"\\b.*\\b[Cc][Oo][Nn][Gg][Rr][Ee][Ss][Ss]\\b.*\\b",
		"\\b.*\\b[Ss][Ee][Mm][Ii][Nn][Aa][Rr]\\b.*\\b",
		"\\b.*\\b[Kk][Oo][Nn][Ff][Ee][Rr][Ee][Nn][Ss][Ii]\\b.*\\b",
		"\\b.*\\b[Pp][Rr][Oo][Cc][Ee][Ee][Dd][Ii][Nn][Gg][Ss]\\b.*\\b",
		"\\b.*\\b[Pp][Rr][Oo][Ss][Ii][Dd][Ii][Nn][Gg]\\b.*\\b",
		"\\b.*\\b[Mm][Ee][Ee][Tt][Ii][Nn][Gg]\\b.*\\b",
		"\\b.*\\b[Pp][Ee][Rr][Tt][Ee][Mm][Uu][Aa][Nn]\\b.*\\b",
		"\\b.*\\b[Oo][Rr][Aa][Ss][Ii]\\b.*\\b",
	); 

	my $spec_pubs = "";
	if (scalar @specific_pubs > 0)
	{
 		$spec_pubs = join("|", @specific_pubs);
		$spec_pubs = "(".$spec_pubs.")";
	}

	my @ed = 
	(
		"[Ee][Dd][\.]{0,1}[[:space:]\-]*[Kk][Ee][[:space:]\-]*[[:digit:]]+",
		"[Ee][Dd][Ii][Ss][Ii][[:space:]\-]*[Kk][Ee][[:space:]\-]*[[:digit:]]+",
		"2nd[[:space:]]Edition",
		"2nd[[:space:]]Ed",
		"3rd[[:space:]]Edition",
		"3rd[[:space:]]Ed",
		"[[:digit:]]+th[[:space:]]Edition",
		"[[:digit:]]+th[[:space:]]Ed",
		"[Ff][Ii][Rr][Ss][Tt][[:space:]]Edition",
		"[Ss][Ee][Cc][Oo][Nn][Dd][[:space:]]Edition",
		"[Tt][Hh][Ii][Rr][Dd][[:space:]]Edition",
	);

	my $edisi = "";
	if (scalar @ed > 0)
	{
 		$edisi = join("|", @ed);
		$edisi = "(".$edisi.")";
	}

	my @url_init =
	(
		"((http(s?):\\/\\/(www\\.)?)",
		"(\\bwww\\.)",
		"(ftp:\\/\\/(ftp\\.)?)",
		"(\\bftp\\.)",
		"((\\b[\\w\\-]+\\.*)*(\\b[\\w\\-]+\\.\\b[\\w\\-]+)+(\\.aero|\\.asia|\\.biz|\\.cat|\\.com|\\.coop|\\.info|\\.int|\\.jobs|\\.mobi|\\.museum|\\.name|\\.net|\\.org|\\.post|\\.pro|\\.tel|\\.travel|\\.xxx|\\.edu|\\.gov|\\.mil|\\.ac|\\.ad|\\.ae|\\.af|\\.ag|\\.ai|\\.al|\\.am|\\.an|\\.ao|\\.aq|\\.ar|\\.as|\\.at|\\.au|\\.aw|\\.ax|\\.az|\\.ba|\\.bb|\\.bd|\\.be|\\.bf|\\.bg|\\.bh|\\.bi|\\.bj|\\.bm|\\.bn|\\.bo|\\.br|\\.bs|\\.bt|\\.bv|\\.bw|\\.by|\\.bz|\\.ca|\\.cc|\\.cd|\\.cf|\\.cg|\\.ch|\\.ci|\\.ck|\\.cl|\\.cm|\\.cn|\\.co|\\.cr|\\.cs|\\.cu|\\.cv|\\.cx|\\.cy|\\.cz|\\.dd|\\.de|\\.dj|\\.dk|\\.dm|\\.do|\\.dz|\\.ec|\\.ee|\\.eg|\\.eh|\\.er|\\.es|\\.et|\\.eu|\\.fi|\\.fj|\\.fk|\\.fm|\\.fo|\\.fr|\\.ga|\\.gb|\\.gd|\\.ge|\\.gf|\\.gg|\\.gh|\\.gi|\\.gl|\\.gm|\\.gn|\\.gp|\\.gq|\\.gr|\\.gs|\\.gt|\\.gu|\\.gw|\\.gy|\\.hk|\\.hm|\\.hn|\\.hr|\\.ht|\\.hu|\\.id|\\.ie|\\.il|\\.im|\\.in|\\.io|\\.iq|\\.ir|\\.is|\\.it|\\.je|\\.jm|\\.jo|\\.jp|\\.ke|\\.kg|\\.kh|\\.ki|\\.km|\\.kn|\\.kp|\\.kr|\\.kw|\\.ky|\\.kz|\\.la|\\.lb|\\.lc|\\.li|\\.lk|\\.lr|\\.ls|\\.lt|\\.lu|\\.lv|\\.ly|\\.ma|\\.mc|\\.md|\\.me|\\.mg|\\.mh|\\.mk|\\.ml|\\.mm|\\.mn|\\.mo|\\.mp|\\.mq|\\.mr|\\.ms|\\.mt|\\.mu|\\.mv|\\.mw|\\.mx|\\.my|\\.mz|\\.na|\\.nc|\\.ne|\\.nf|\\.ng|\\.ni|\\.nl|\\.no|\\.np|\\.nr|\\.nu|\\.nz|\\.om|\\.pa|\\.pe|\\.pf|\\.pg|\\.ph|\\.pk|\\.pl|\\.pm|\\.pn|\\.pr|\\.ps|\\.pt|\\.pw|\\.py|\\.qa|\\.re|\\.ro|\\.rs|\\.ru|\\.rw|\\.sa|\\.sb|\\.sc|\\.sd|\\.se|\\.sg|\\.sh|\\.si|\\.sj|\\.sk|\\.sl|\\.sm|\\.sn|\\.so|\\.sr|\\.ss|\\.st|\\.su|\\.sv|\\.sx|\\.sy|\\.sz|\\.tc|\\.td|\\.tf|\\.tg|\\.th|\\.tj|\\.tk|\\.tl|\\.tm|\\.tn|\\.to|\\.tp|\\.tr|\\.tt|\\.tv|\\.tw|\\.tz|\\.ua|\\.ug|\\.uk|\\.us|\\.uy|\\.uz|\\.va|\\.vc|\\.ve|\\.vg|\\.vi|\\.vn|\\.vu|\\.wf|\\.ws|\\.ye|\\.yt|\\.yu|\\.za|\\.zm|\\.zw))"
	);
	
	my $initial_url = "";
	if (scalar @url_init > 0)
	{
 		$initial_url = join("|", @url_init);
		$initial_url = "(".$initial_url.")";
	}


	# my $initial_match = "(?:\\b[[:alpha:]]\\.|\\b[[:alpha:]]\\b)";	
	# my $name_match = "(?:(?:[[:alpha:],;&-]+)\\b)";
	my $initial_match = "(?:\\b[[:digit:]]*[[:alpha:]\\p{L}\\']\\.\\-|\\b[[:digit:]]*[[:alpha:]\\p{L}\\'\\-]\\b)";	
	my $name_match = "(?:(?:[[:alpha:]\\p{L},;&-\\-]+[[:digit:][:alpha:]\\p{L},;&-\\-]*)\\b)";
	my $conjs = "(?:\\s+und\\s+|\\s+band\\s+|\\s|,|&|;|\\(|\\)|\\.)";

	

	my %matches =
	(
		"_AUFIRST_"        => "([[:alpha:]\.]+)",
		"_AULAST_"         => "([[:alpha:]-]+)",
		"_ISSN_"           => "([[:digit:]-]+)",
		"_AUTHORS_"        => "((?:$initial_match|$name_match|$conjs)+?)",
		"_DATE_"           => "([[:digit:]]{2}/[[:digit:]]{2}/[[:digit]]{2})",
		"_YEAR_"           => "([[:digit:]]{4}[[:lower:]]?)",
		"_TITLE_"          => "(.+?[a-zA-Z]+.+?)",
		"_EDITORTITLE_"    => "(.+?[a-zA-Z]+.+?)",
		"_SUBTITLE_"       => "(.+?[a-zA-Z]+.+?)",
		"_CHAPTER_"        => "([[:digit:]]+)",
		"_UCTITLE_"        => "([^[:lower:]]+)",
		"_CAPTITLE_"       => "([[:upper:]][^[:upper:]]+)",
		"_PUBLICATION_"    => "$spec_pubs",
		"_PUBLISHER_"      => "([[:alpha:]]+.*[[:alpha:]]*)",
		"_PUBLOC_"         => "([[:alpha:]]+[^:]*[[:alpha:]]*)",
		# "_EDITOR_"       => "([[:alpha:]\\.,;\\s&-]+)",
		"_EDITOR_"         => "((?:$initial_match|$name_match|$conjs)+?)",
		"_UCPUBLICATION_"  => "([^[:lower:]]+)",
		"_CAPPUBLICATION_" => "([[:upper:]][^[:upper:]]+)",
		"_VOLUME_"         => "([[:digit:]IVX]+)",
		"_ISSUE_"          => "([[:digit:]-]+)",
		"_PAGES_"          => "([[:digit:]]+(-{1}[[:digit:]]+){0,1})",
		# "_PAGES_"        => "([A-Z1-9][0-9]*-{1}[A-Z1-9][0-9]*)",
		"_ANY_"            => "(.+?)",
		"_ISBN_"           => "([[:digit:]X-]+)",		
		"_ISSN_"           => "([[:digit:]X-]+)",		
		"_SPAGE_"          => "([[:digit:]]+)",
		"_EPAGE_"          => "([[:digit:]]+)",
		"_URL_"            => "$initial_url([-\\w\\.:\\/\\s\\S]+)(\\s\\.\\S+|#\\w+|\\/[\\w\\-\\.\\S]*|\\b))",
		"_EDISI_"          => "$edisi",
	);


	my(@newtemplates) = ();
	my @arr = ();
	my @arr1 = ();
	my @a = ();
	my $currkey = "";
	my $curr = "";

	my $numdot1 = $ref =~ tr/\. //;
	my $numdot2 = 0;
	my $numkoma1 = $ref =~ tr/\, //;
	my $numkoma2 = 0;
	my $numtitikdua1 = $ref =~ tr/\: //;
	my $numtitikdua2 = 0;

	my @tkey = ();
	my @tmptkey = ();
	my $tref="";
	my $inref = -1;

	CURRTEMPLATE: foreach my $template (@$Biblio::Citation::Parser::Templates::templates)
	{
		@arr= split('=>',$template);
		$currkey=$arr[0];
		$curr=$arr[1];

		if($ref !~ /^$matches{_AUTHORS_}\. $matches{_YEAR_}\./ && $curr =~ /^_AUTHORS_\. _YEAR_\./){
			next;
		}elsif($ref =~ /^$matches{_AUTHORS_}\. $matches{_YEAR_}\./ && $curr !~ /^_AUTHORS_\. _YEAR_\./){
			next;
		}

		# if($ref !~ /$matches{_PAGES_}\.$/ && $curr =~ /_PAGES_\.$/){
		# 	next;
		# }elsif($ref =~ /$matches{_PAGES_}\.$/ && $curr !~ /_PAGES_\.$/){
		# 	next;
		# }
		# if($ref !~ /$matches{_PAGES_}\.$/ && $curr =~ /_PAGES_\.$/){
		# 	next;
		# }elsif($ref =~ /$matches{_PAGES_}\.$/ && $curr !~ /_PAGES_\.$/){
		# 	next;
		# }

		# if($ref !~ /\b$matches{_PAGES_}\.$/ && $curr =~ /\b_PAGES_\.$/){
		# 	next;
		# }elsif($ref =~ /\b$matches{_PAGES_}\.$/ && $curr !~ /\b_PAGES_\.$/){
		# 	next;
		# }

		# if($ref !~ /\b$matches{_PAGES_}\b/ && $curr =~ /\b_PAGES_\b/){
		# 	next;
		# }elsif($ref =~ /\b$matches{_PAGES_}\b/ && $curr !~ /\b_PAGES_\b/){
		# 	next;
		# }

		if($ref !~ /\bno\. $matches{_ISSUE_}\.$/ && $curr =~ /no\. _ISSUE_\.$/){
			next;
		}elsif($ref =~ /\bno\. $matches{_ISSUE_}\.$/ && $curr !~ /no\. _ISSUE_\.$/){
			next;
		}

		if($ref !~ /\bvol\. $matches{_VOLUME_}\b/ && $curr =~ /vol\./){
			next;
		}elsif($ref =~ /\bvol\. $matches{_VOLUME_}\b/ && $curr !~ /vol\./){
			next;
		}

		if($ref !~ /vol\. $matches{_VOLUME_}\.$/ && $curr =~ /vol\. _VOLUME_\.$/){
			next;
		}elsif($ref =~ /vol\. $matches{_VOLUME_}\.$/ && $curr !~ /vol\. _VOLUME_\.$/){
			next;
		}

		if($ref !~ /hlm\. $matches{_PAGES_}/ && $curr =~ /hlm\./){
			next;
		}
		elsif($ref =~ /hlm\. $matches{_PAGES_}/ && $curr !~ /hlm\./){
			next;
		}

		if($ref !~ /editor/ && $curr =~ /editor/){
			next;
		}elsif($ref =~ /editor/ && $curr !~ /editor/){
			next;
		}

		if($ref !~ /penerjemah/ && $curr =~ /penerjemah/){
			next;
		}elsif($ref =~ /penerjemah/ && $curr !~ /penerjemah/){
			next;
		}

		if($ref !~ /Terjemahan dari\:/ && $curr =~ /Terjemahan dari\:/){
			next;
		}elsif($ref =~ /Terjemahan dari\:/ && $curr !~ /Terjemahan dari\:/){
			next;
		}

		if($ref !~ /Di dalam\:/ && $curr =~ /Di dalam\:/){
			next;
		}elsif($ref =~ /Di dalam\:/ && $curr !~ /Di dalam\:/){
			next;
		}

		if($currkey=~/reject/){
		}elsif($ref =~ /$matches{_URL_}/ ){
			if($currkey !~ /website/){
				next
			}else{
				if($ref !~ /hlm\. $matches{_PAGES_}\./ && $curr =~ /hlm\. _PAGES_\./){
					next;
				}elsif($ref =~ /hlm\. $matches{_PAGES_}\./ && $curr !~ /hlm\. _PAGES_\./){
					next;
				}
				if($ref !~ /$matches{_PAGES_}\. $matches{_UR_}/ && $curr =~ /_PAGES_\. _URL/){
					next;
				}elsif($ref =~ /$matches{_PAGES_}\. $matches{_UR_}/ && $curr !~ /_PAGES_\. _URL/){
					next;
				}
				if($ref !~ /$matches{_VOLUME_}\($matches{_ISSUE_}\):$matches{_PAGES_}\./ && $curr =~ /_VOLUME_\(_ISSUE_\):_PAGES_\./){
					next;
				}elsif($ref =~ /$matches{_VOLUME_}\($matches{_ISSUE_}\):$matches{_PAGES_}\./ && $curr !~ /_VOLUME_\(_ISSUE_\):_PAGES_\./){
					next;
				}
				if($ref !~ /$matches{_VOLUME_}\($matches{_ISSUE_}\)/ && $curr =~ /_VOLUME_\(_ISSUE_\)/){
					next;
				}elsif($ref =~ /$matches{_VOLUME_}\($matches{_ISSUE_}\)/ && $curr !~ /_VOLUME_\(_ISSUE_\)/){
					next;
				}

				if($ref !~ /Tersedia pada\:/ && $curr =~ /Tersedia pada\:/){
					next;
				}elsif($ref =~ /Tersedia pada\:/ && $curr !~ /Tersedia pada\:/){
					next;
				}

				if($ref !~ /\[Internet\]/ && $curr =~ /\[Internet\]/){
					next;
				}elsif($ref =~ /\[Internet\]/ && $curr !~ /\[Internet\]/){
					next;
				}

				if($ref !~ /\[diunduh/ && $curr =~ /\[diunduh/){
					next;
				}elsif($ref =~ /\[diunduh/ && $curr !~ /\[diunduh/){
					next;
				}

				if($ref !~ /Retrieved/ && $curr =~ /Retrieved/){
					next;
				}elsif($ref =~ /Retrieved/ && $curr !~ /Retrieved/){
					next;
				}
				if($ref !~ /\[$matches{_ANY_}\]\.$/ && $curr =~ /\[_ANY_\]\.$/){
					next;
				}elsif($ref =~ /\[$matches{_ANY_}\]\.$/ && $curr !~ /\[_ANY_\]\.$/){
					next;
				}
				if($ref !~ /\. \[$matches{_ANY_}\]\.$/ && $curr =~ /\. \[_ANY_\]\.$/){
					next;
				}elsif($ref =~ /\. \[$matches{_ANY_}\]\.$/ && $curr !~ /\. \[_ANY_\]\.$/){
					next;
				}
				if($ref !~ /$matches{_URL_}\[$matches{_ANY_}\]\.$/ && $curr =~ /_URL_\[_ANY_\]\.$/){
					next;
				}elsif($ref =~ /$matches{_URL_}\[$matches{_ANY_}\]\.$/ && $curr !~ /_URL_\[_ANY_\]\.$/){
					next;
				}

			    if($ref =~/\. $matches{_URL_}/ && $curr !~  /\. _URL_/){
			    	next;
			    }

			}
		}elsif($ref =~ /\[skripsi\]|\[tesis\]|\[disertasi\]/){
			if($currkey!~ /skripsi/){
				next;
			}else{
				if($ref !~ /(\[skripsi\]|\[tesis\]|\[disertasi\])\.$/ && $curr =~ /(\[skripsi\]|\[tesis\]|\[disertasi\])\.$/){
					next;
				}
				elsif($ref =~ /(\[skripsi\]|\[tesis\]|\[disertasi\])\.$/ && $curr !~ /(\[skripsi\]|\[tesis\]|\[disertasi\])\.$/){
					next;
				}
				if($ref !~ /\[skripsi\]/ && $curr =~ /\[skripsi\]/){
					next;
				}
				elsif($ref =~ /\[skripsi\]/ && $curr !~ /\[skripsi\]/){
					next;
				}
				if($ref !~ /\[tesis\]/ && $curr =~ /\[tesis\]/){
					next;
				}
				elsif($ref =~ /\[tesis\]/ && $curr !~ /\[tesis\]/){
					next;
				}
				if($ref !~ /\[disertasi\]/ && $curr =~ /\[disertasi\]/){
					next;
				}
				elsif($ref =~ /\[disertasi\]/ && $curr !~ /\[disertasi\]/){
					next;
				}

			}
		}else{
			if($currkey=~ /buku/ || $currkey=~/prosiding/ || $currkey=~/jurnal/){
				if($ref !~ /hlm\. $matches{_PAGES_}\./ && $curr =~ /hlm\. _PAGES_\./){
					next;
				}elsif($ref =~ /hlm\. $matches{_PAGES_}\./ && $curr !~ /hlm\. _PAGES_\./){
					next;
				}
				if($ref !~ /$matches{_VOLUME_}\($matches{_ISSUE_}\):$matches{_PAGES_}\./ && $curr =~ /_VOLUME_\(_ISSUE_\):_PAGES_\./){
					next;
				}elsif($ref =~ /$matches{_VOLUME_}\($matches{_ISSUE_}\):$matches{_PAGES_}\./ && $curr !~ /_VOLUME_\(_ISSUE_\):_PAGES_\./){
					next;
				}
				if($ref !~ /$matches{_VOLUME_}\($matches{_ISSUE_}\)/ && $curr =~ /_VOLUME_\(_ISSUE_\)/){
					next;
				}elsif($ref =~ /$matches{_VOLUME_}\($matches{_ISSUE_}\)/ && $curr !~ /_VOLUME_\(_ISSUE_\)/){
					next;
				}
				if($ref =~ /\. $matches{_EDISI_}\./ && $curr !~ /\. _EDISI_\./){
					next;
				}
				# if($ref =~ /^$matches{_AUTHORS_}\. $matches{_YEAR_}\. (.*)$matches{_PUBLICATION_}(.*)\.$/ && $curr !~ /^_AUTHORS_\. _YEAR_\. (.*)_PUBLICATION_(.*)\.$/){
				# 	next;
				# }elsif($ref !~ /^$matches{_AUTHORS_}\. $matches{_YEAR_}\. (.*)$matches{_PUBLICATION_}(.*)\.$/ && $curr =~ /^_AUTHORS_\. _YEAR_\. (.*)_PUBLICATION_(.*)\.$/){
				# 	next;
				# }
			}else{
				next;
			}
		}

	    $numdot2 = $curr =~ tr/\. //;
	    $numkoma2 = $curr =~ tr/\, //;
	    $numtitikdua2 = $curr =~ tr/\: //;

	    if($numdot1<$numdot2){
	    	next;
	    }
	    if($numkoma1<$numkoma2){
	    	next;
	    }
	    if($numtitikdua1<$numtitikdua2){
	    	next;
	    }

		# print "###".$curr."\n";
	    @tmptkey = split(/ /,$curr);
	    @tkey = ();
	    $tref="";
	    CURRKEY1: foreach (@tmptkey){
	    	if($_ !~ /_(.+)_/){
	    		$tref .= $_." ";
	    		next CURRKEY1; 
	    	}
	    	if($tref !~ ""){
	    		$_ = trim($tref)." ".$_;
	    		$tref="";
	    	}
	    	# $treftrim($tref);
	    	push @tkey, $_; 
	    	$tref="";
	    }
	    CURRKEY2: foreach(@tkey){
			s/\\/\\\\/g;
			s/\-/\\\-/g;
			s/\+/\\\+/g;
			s/\*/\\\*/g;
			s/\&/\\\&/g;
			s/\;/\\\;/g;
			s/\(/\\\(/g;
			s/\)/\\\)/g;
			s/\[/\\\[/g;
			s/\]/\\\]/g;
			s/\./\\\./g;
			s/\,/\\\,/g;
			s/ /\[\[:space:\]\]+/g;
			s/\#\?\#/\[\[:print:\]\]*/g;
	    	foreach my $key (keys %matches){
	    		s/$key/$matches{$key}/g;
	    	}
	    	# print $_."\n";
	    	if($ref !~ /$_/){
	    		next CURRTEMPLATE;
	    	}
	    }

		$_ = $arr[1];
		s/\\/\\\\/g;
		s/\-/\\\-/g;
		s/\+/\\\+/g;
		s/\*/\\\*/g;
		s/\&/\\\&/g;
		s/\;/\\\;/g;
		s/\(/\\\(/g;
		s/\)/\\\)/g;
		s/\[/\\\[/g;
		s/\]/\\\]/g;
		s/\./\\\./g;
		s/\,/\\\,/g;
		s/ /\[\[:space:\]\]+/g;
		s/\#\?\#/\[\[:print:\]\]*/g;


		foreach my $key (keys %matches)
		{
			# $currkey = $ro->optimize($matches{$key});
			# if(/$key/){
			# 	if($ref !~ /$matches{$key}/){
			# 		next CURRTEMPLATE;
			# 	}
			# }
			s/$key/$matches{$key}/g;
			# s/$key/$currkey/g;
		}
		$_ .= "[.]?";
		@arr = ();
		# print $_."\n";
		push @newtemplates, $ro->optimize($_);
		# push @newtemplates, $_;
		push @a, $template;
	}
	# print "check_templates\n";
	# print Dumper(@newtemplates);exit;
	my $index = 0;	
	my $key = "";	
	my @vars = ();
	my @matchedvars = ();
	my @out = ();

	my $curr_conc = 0;
	my $curr_rel = 0;
	my $max_conc = 0;
	my $max_rel = 0;
	my $best_match = "";
	my $best_orig = "";
	print "\n".$#newtemplates."\n";
	# print Dumper(@a);
	foreach my $currtemplate (@newtemplates)
	{
		# print $index."=>";
		@arr = split('=>',$a[$index]);
		my $original = $arr[1];
		$currkey=$arr[0];
		$curr = $arr[1];
		# print $curr."\n";
		# print $ref."\n";
		$index++;
		print $currkey."=>".$curr."\n";
		# my $chk =chktemplates($curr,@out);
		# print $chk."\n";
		# if($chk==-1){
		# 	push @out, $curr;
		# 	next;
		# }
		if ($ref =~ /^$currtemplate/)
		{
			# print $currtemplate."\n";
			$curr_rel = get_reliability($original);
			$curr_conc = get_concreteness($original);
			if ($curr_rel > $max_rel)
			{
				$best_match = $currtemplate;
				$best_orig = $original;
				$max_conc = $curr_conc;
				$max_rel = $curr_rel;
				$key = $arr[0];
			}
			elsif ($curr_rel == $max_rel && $curr_conc > $max_conc)
			{
				$best_match = $currtemplate;
				$best_orig = $original;
				$max_conc = $curr_conc;
				$max_rel = $curr_rel;
				$key = $arr[0];
			}
			print $curr_rel."\n";
			print $curr_conc."\n";
		}else{
			push @out, $curr;
		}
		@arr = ();
	}

	# my @a = $Biblio::Citation::Parser::Templates::templates;
	# print Dumper(@a);exit;

	# @out = findbest($ref,\@newtemplates,\@a);
	# $best_match = $out[0];
	# $best_orig = $out[1];
	# $max_conc = $out[2];
	# $max_rel = $out[3];
	# $key = $out[4];
	# $curr_rel = $out[5];
	# $curr_conc = $out[6];

	$metaout{match} = $best_orig;
	$metaout{key} = $key;
	@vars = ($best_orig =~ /_([A-Z]+)_/g);
	@matchedvars = ($ref =~ /^$best_match$/);
	# print Dumper(@vars);
	# print Dumper(@matchedvars);

	$index = 0;
	if (scalar @matchedvars > 0)
	{
		foreach(@vars)
		{
			$matchedvars[$index] =~ s/^\s*(.+)\s*$/$1/;
			$metaout{lc $_} = $matchedvars[$index];
			$index++;
		}
	}
	foreach(keys %metaout)
	{
		if (/^uc/)
		{
			my $alt = $_;
			$alt =~ s/^uc//;
			if (!defined $metaout{$alt} || $metaout{$alt} eq "")
			{
				$metaout{$alt} = $metaout{$_};
			}
		}
	}

	# Create a marked-up version 
	my $in_ref = $ref;
	my $in_tmp = $best_orig;
	my $in_tmp2 = $best_orig;
	# print Dumper(%metaout);exit;
	foreach(keys %metaout)
	{
		next if (!defined $metaout{$_} || $metaout{$_} eq "" || $_ eq "any");
		my $toreplace = "_".(uc $_)."_";
		if(/url/ && $metaout{$_}=~/^(?!http(s?):\/\/)/ && $metaout{$_}=~/^(?!ftp:\/\/)/ && $metaout{$_}=~/^(?!ftp\.)/){
			$metaout{$_} = "http://".$metaout{$_};
		}elsif(/year/ && $metaout{$_}=~/[a-z]$/){
			$metaout{$_} =~ s/(\d+)[a-z]$/$1/;
		}
		$in_tmp =~ s/$toreplace/<$_>$metaout{$_}<\/$_>/g;
		$in_tmp2 =~ s/$toreplace/$metaout{$_}/g;
	}


	# Fix any _ANY_s
	$in_tmp2 =~ s/\\/\\\\/g;
	$in_tmp2 =~ s/\(/\\\(/g;
	$in_tmp2 =~ s/\)/\\\)/g;
	$in_tmp2 =~ s/\[/\\\[/g;
	$in_tmp2 =~ s/\]/\\\]/g;
	$in_tmp2 =~ s/\./\\\./g;
	$in_tmp2 =~ s/ /\[\[:space:\]\]+/g;
	$in_tmp2 =~ s/\?/\\\?/g;
	$in_tmp2 =~ s/_ANY_/(.+)/g;
	my(@anys) = ($in_ref =~ /$in_tmp2/g);
	
	foreach(@anys)
	{
		$in_tmp =~ s/_ANY_/<any>$_<\/any>/;
	}
	my $end_run = time();
	my $run_time = $end_run - $start_run;

	$metaout{marked} = $in_tmp;
	$metaout{runtime} = $run_time;
	# Map to OpenURL
	if (defined $metaout{authors})
	{
		$metaout{authors} = [handle_authors($metaout{authors})];
		$metaout{aulast} = $metaout{authors}[0]->{family};
		$metaout{aufirst} = $metaout{authors}[0]->{given};
	}
	if (defined $metaout{publisher} && !defined $metaout{publication})
	{
		$metaout{genre} = "book";
	}
	$metaout{atitle} = $metaout{title};	
	$metaout{title} = $metaout{publication};
	if (defined $metaout{cappublication}) { $metaout{title} = $metaout{cappublication} };
	$metaout{date} = $metaout{year};
	return %metaout;

}

=pod

=item $metadata = $parser-E<gt>parse($reference);

This method provides a wrapper to the extract_metadata
function. Simply pass a reference string, and a metadata
hash is returned.

=cut

sub parse
{
	my($self, $ref) = @_;
	my $hashout = {$self->extract_metadata($ref)};
	return $hashout;
}

sub trim($)
{
	my $string = shift;
	$string =~ s/^\s+//;
	$string =~ s/\s+$//;
	return $string;
}

sub chktemplates
{
	my ($curr,@out) = @_;
	if($#out>0){
		foreach(@out){
			if($curr =~/^$_/){
				return -1;
			}
		}
		return 1;
	}else{
		return 1;
	}
}

# sub findbest{
# 	my($ref, $newtemplates, $templates) = @_;
# 	my @left = ();
# 	my @right= ();
# 	my @lefttemplates = ();
# 	my @righttemplates= ();
# 	my @outleft = ();
# 	my @outright= ();
# 	my @out =();
# 	my $mid;
# 	my $i=0;

# 	if((scalar @$newtemplates)>1){
# 		$mid = (scalar @$newtemplates)/2;
# 		for($i=0;$i<$mid ;$i++){
# 			push @left, $newtemplates->[$i];
# 			push @lefttemplates, $templates->[$i];
# 		}
# 		for($i=$mid;$i< (scalar @$newtemplates) ;$i++){
# 			push @right, $newtemplates->[$i];
# 			push @righttemplates, $templates->[$i];
# 		}
# 		@outleft = findbest($ref,\@left,\@lefttemplates);
# 		@outright = findbest($ref,\@right,\@righttemplates);
# 		if($#outleft>0){
# 			@out = @outleft;
# 			if($#outright>0){
# 				if ($outright[5] > $outleft[3]){
# 					@out = @outright;
# 				}elsif ($outright[5] == $outleft[3] && $outright[6] > $outleft[2]){
# 					@out = @outright;
# 				}
# 			}
# 		}else{
# 			@out = @outright;
# 		}
# 	}else{
# 		my $currtemplate = $newtemplates->[0];
# 		my $curr = "";
# 		my $currkey = "";
# 		my $key = "";	
# 		my $curr_conc = 0;
# 		my $curr_rel = 0;
# 		my $max_conc = 0;
# 		my $max_rel = 0;
# 		my $best_match = "";
# 		my $best_orig = "";
# 		my @arr = split('=>',$templates->[0]);
# 		my $original = $arr[1];
# 		$curr = $arr[1];
# 		$currkey = $arr[0];
# 		# print $templates->[0]."\n";

# 		if($ref =~ /$matches{_URL_}/ && $currkey =~ /website/){
# 			# next;
# 		}elsif($ref =~ /$matches{_PUBLICATION_}/ && $currkey=~ /prosiding/){
# 			# next;
# 		}elsif($ref =~ /\[skripsi\]|\[tesis\]|\[disertasi\]/ && $currkey=~ /skripsi/){
# 			# next;
# 		}elsif($ref =~ /$matches{_VOLUME_}\($matches{_ISSUE_}\):$matches{_PAGES_}|$matches{_VOLUME_}\($matches{_ISSUE_}\) $matches{_PAGES_}|$matches{_VOLUME_}\($matches{_ISSUE_}\), $matches{_PAGES_}|$matches{_VOLUME_}\($matches{_ISSUE_}\): hlm\. $matches{_PAGES_}|$matches{_VOLUME_}\($matches{_ISSUE_}\)\. hlm\. $matches{_PAGES_}|$matches{_VOLUME_}\($matches{_ISSUE_}\), hlm\. $matches{_PAGES_}|$matches{_VOLUME_}\($matches{_ISSUE_}\)|$matches{_VOLUME_}: $matches{_PAGES_}|$matches{_VOLUME_}: hlm\. $matches{_PAGES_}|vol\./ && $currkey=~ /jurnal/){
# 			# next;
# 		}else{
# 			if($currkey=~/buku/ || $currkey=~/reject/){
# 			}else{
# 				return @out;
# 			}
# 		}
		
# 		print $currkey."=>".$curr."\n";

# 		if ($ref =~ /^$currtemplate/)
# 		{
# 			# print $currtemplate."\n";
# 			$curr_rel = get_reliability($original);
# 			$curr_conc = get_concreteness($original);
# 			if ($curr_rel > $max_rel)
# 			{
# 				$best_match = $currtemplate;
# 				$best_orig = $original;
# 				$max_conc = $curr_conc;
# 				$max_rel = $curr_rel;
# 				$key = $arr[0];
# 			}
# 			elsif ($curr_rel == $max_rel && $curr_conc > $max_conc)
# 			{
# 				$best_match = $currtemplate;
# 				$best_orig = $original;
# 				$max_conc = $curr_conc;
# 				$max_rel = $curr_rel;
# 				$key = $arr[0];
# 			}
# 			@out = ($best_match,$best_orig,$max_conc,$max_rel,$key, $curr_rel,$curr_conc);
# 		}
# 	}
# 	return @out;		
# }
1;

__END__


=pod

=back

=head1 NOTES

The parser provided should not be seen as exhaustive. As new techniques
are implemented, further modules will be released.

=head1 AUTHOR

Mike Jewell <moj@ecs.soton.ac.uk>

=cut
