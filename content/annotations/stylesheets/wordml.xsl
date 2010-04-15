<?xml version="1.0"?> 

<xsl:stylesheet version="1.0"
	xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:dcterms="http://purl.org/dc/terms/"
	xmlns:ore="http://www.openarchives.org/ore/terms/"
	xmlns:foaf="http://xmlns.com/foaf/0.1/"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:layout="http://maenad.itee.uq.edu.au/lore/layout.owl#"
	xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"
	xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint"
	xmlns:o="urn:schemas-microsoft-com:office:office"
	xmlns:http="http://www.w3.org/1999/xx/http#"
	xmlns:ans="http://www.w3.org/2000/10/annotation-ns#"
	exclude-result-prefixes="rdf dc dcterms ore foaf xsl">

	<xsl:output method="xml" indent="yes"/>
	<xsl:strip-space elements="*"/>
	<xsl:template match="/">

		<xsl:processing-instruction name="mso-application">progid="Word.Document"</xsl:processing-instruction>
		<w:wordDocument>
			<o:DocumentProperties>
	  			<o:Title>
		  				Document generated by LORE
	  			</o:Title>
	  		</o:DocumentProperties>
	  		<w:styles>
	            <w:style w:type="paragraph" w:styleId="Heading1">
	                <w:name w:val="heading 1"/>
	                <w:pPr>
	                    <w:pStyle w:val="Heading1"/>
	                    <w:keepNext/>
	                    <w:spacing w:before="400" w:after="60"/>
	                    <w:outlineLvl w:val="0"/>
	                </w:pPr>
	                <w:rPr>
	                    <w:rFonts w:ascii="Arial" w:h-ansi="Arial"/>
	                    <w:b/>
	                    <w:sz w:val="24"/>
	                </w:rPr>
	            </w:style>
	            <w:style w:type="paragraph" w:styleId="Heading2">
	                <w:name w:val="heading 2"/>
	                <w:pPr>
	                    <w:pStyle w:val="Heading2"/>
	                    <w:keepNext/>
	                    <w:spacing w:before="200" w:after="0"/>
	                    <w:outlineLvl w:val="1"/>
	                </w:pPr>
	                <w:rPr>
	                    <w:rFonts w:ascii="Arial" w:h-ansi="Arial"/>
	                    <w:b/>
	                    <w:sz w:val="18"/>
	                </w:rPr>
	            </w:style>
	            <w:style w:type="character" w:styleId="Hyperlink">
	                <w:rPr>
	                    <w:color w:val="0000FF"/>
	                    <w:u w:val="single"/>
	                </w:rPr>
	            </w:style>
	        </w:styles>
	  		
	  		<w:body>
			<xsl:apply-templates select="//rdf:Description[@rdf:about]"/>
		  </w:body>
		</w:wordDocument>
	</xsl:template>
	
	<xsl:template match="rdf:Description[@rdf:about]">
		<!--  properties -->
		<w:p>
				<w:r>
					<w:rPr>
						<w:rStyle w:val="EndnoteReference" />
					</w:rPr>
					<w:footnote>
					<w:p>
					<w:pPr><w:pStyle w:val="EndnoteText" /></w:pPr>
					<w:r>
					<w:rPr><w:rStyle w:val="EndnoteReference"/></w:rPr>
					<w:endnoteRef />
					</w:r>
					<w:r>
					<w:t><xsl:value-of select="ans:body/rdf:Description/http:Body" />
					</w:t>
					</w:r>
					</w:p>
					</w:footnote>
				</w:r>
		</w:p>
	</xsl:template>
	
</xsl:stylesheet>