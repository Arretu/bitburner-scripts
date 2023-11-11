/** @param {NS} ns **/
export async function main(ns) {
	
	let servers = ns.scan('home');

	for (let i = 0; i < servers.length; i++) {
		
		let nextscan = ns.scan(servers[i]);
		for (let j = 0; j < nextscan.length; j++) {
				if (servers.indexOf(nextscan[j]) === -1) {
				servers.push(nextscan[j]);
			}
		}
	}


	//ns.tprint(servers);

	ns.write("/data/static/allservers.txt",servers.toString(),"w");
}



