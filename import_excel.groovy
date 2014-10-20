import org.apache.poi.ss.usermodel.*
@Grab(group='org.apache.poi', module='poi-ooxml', version='3.10.1')
@Grab(group='org.apache.poi', module='ooxml-schemas', version='1.1')

def wb = WorkbookFactory.create(new File(args.length == 0 ? "data.xlsx" : args[0]))

def parseFormula = {
    try{ 
        return it.stringCellValue
    }
    catch(e) {
        return it.numericCellValue
    }
}

// from https://poi.apache.org/apidocs/org/apache/poi/ss/usermodel/Cell.html
def parseCell = [
    0 : { DateUtil.isCellDateFormatted(it) ? it.dateCellValue : it.numericCellValue },
    1 : { it.richStringCellValue.string },    
    2 : { parseFormula(it) },
    3 : { return "" },    
    4 : { it.booleanCellValue },    
    5 : { return "ERROR" },    
]



for(def i=0; i < wb.numberOfSheets; i++){
    def sheet = wb.getSheetAt(i)
    println i + ": Sheet -> " + sheet.sheetName
    println "========================="
    
    def vlist = []
    def h = []    

    // top row get loop first (header)
    for(def row in sheet){
        def ri = row.rowNum
        println "\tRow -> " + ri
        def v
        if(ri != 0){ 
            v = [:]
            vlist.add(v)
        }
        for(def cell in row){
            def p = parseCell[cell.cellType](cell)
            def ci = cell.columnIndex;
            println "\t\tCell -> " + ci + ":" + p
            if(ri == 0){ 
                h.add(p)
            }
            else {
                def header = h[ci]
                if(header != null && !header.trim().equals("")){
	                if(header.endsWith("id")){
	                    p = (int) p
	                }
	                v[header] = p                	
                }
            }
        }                    
    }
    println " header->" + h
    println " values->" + vlist
    def json = new groovy.json.JsonBuilder(vlist).toPrettyString()
    println " json->" + json
    def fw = new FileWriter("app/sample/" + sheet.sheetName + ".json")
    fw << json
    fw.close()    
}