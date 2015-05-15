
# @author Tyler Beck
# @version 1.0.0
# @desc Retrieves all java-style written properties and print's them to stdout.

BEGIN {
    FS="=";
    n="";
    v="";
    c=0;
    count=0;
}
/^\#/ {
    c=0;
    next;
}
/\\$/ && (c==0) && (NF>=2) {
    e=index($0,"=");
    n=substr($0,1,e-1);
    v=substr($0,e+1,length($0) - e - 1);

    c=1;
    next;
}
/^[^\\]+\\$/ && (c==1) {
    v= "" v substr($0,1,length($0)-1);
    next;
}
((c==1) || (NF>=2)) && !/^[^\\]+\\$/ {
    if (c==0) {
        e=index($0,"=");
        n=substr($0,1,e-1);
        v=substr($0,e+1,length($0) - e);
    } else {
        c=0;
        v= "" v $0;
    }
    gsub(/[^A-Za-z0-9_]/,"_",n);
    gsub(/[\n\r]/,"",v);
    count++;
    if(count > 1) {
	printf ",";
    }
    printf "\"" n "\":\"" v "\"";
    n = "";
    v = "";
}
END {}
