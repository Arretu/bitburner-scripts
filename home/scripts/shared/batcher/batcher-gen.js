/** @param {NS} ns */
export async function main(ns, target, hostRAM) {



	//TESTING
	target = "phantasy";
	hostRAM = 8192;
	//TESTING

	//HWGW
	//Make virtual player and server,
	let player = ns.getPlayer();
	let targetInfo = ns.getServer(target);
	await ns.sleep(200);

	//Set Target percentage (1.0 is 100%)
	let tPerc = 1;

	//Find max threads possible on each host.
	let hSize = 1.7;
	let gwSize = 1.75;
	let maxhThreads = Math.floor(hostRAM / hSize);
	let maxgwThreads = Math.floor(hostRAM / gwSize);
	

	//Set hack difficulty to min and money to min.
	targetInfo.hackDifficulty = targetInfo.minDifficulty;
	targetInfo.moneyAvailable = targetInfo.moneyMax / 100;

	await ns.sleep(500);

	//Debug
	ns.tprint("DEBUG money max:",targetInfo.moneyMax,"money avail ", targetInfo.moneyAvailable," min sec ",targetInfo.minDifficulty);

	//Gather hgw script data.
	let gTime = Math.ceil(ns.formulas.hacking.growTime(targetInfo,player));
	let wTime = Math.ceil(ns.formulas.hacking.weakenTime(targetInfo,player));
	let hTime = Math.ceil(ns.formulas.hacking.hackTime(targetInfo,player));
	let gThreads100 = Math.ceil(ns.formulas.hacking.growThreads(targetInfo,player,targetInfo.moneyMax));
	let gSecGain = gThreads100*0.004;
	
	
	targetInfo.moneyAvailable = targetInfo.moneyMax;
	await ns.sleep(100);
	
	let hThreads100 = Math.floor(ns.hackAnalyzeThreads(target,(targetInfo.moneyMax*0.9)));
	let hSecGain = ns.hackAnalyzeSecurity(hThreads100,target);
	let tSecGain = gSecGain + hSecGain;
	ns.tprint("DEBUG tsecgain: ",tSecGain);
	let wThreads100 = Math.ceil(tSecGain/0.05);

	ns.tprint("DEBUG wThreads", wThreads100);

	await ns.sleep(100);

//Work out how much RAM one GWHW cycle needs.
	let tHackRAM = 1.7*hThreads100;
	let tGrowRAM = 1.75*gThreads100;
	let tWeakRAM = 2*1.75*wThreads100;

	let batchRAM = tWeakRAM + tGrowRAM + tWeakRAM;

	let batchNum = Math.floor(hostRAM/batchRAM);
	ns.tprint("DEBUG batchNum ",batchNum, " batch RAM", batchRAM);




	//DEBUG ZONE
	let debugArray = [["maxhThreads",maxhThreads],["maxgwThreads",maxgwThreads],["gTime",gTime],["hTime",hTime],["wTime",wTime],["gThreads100",gThreads100],["gSecGain",gSecGain],["hThreads100",hThreads100],["hSecGain",hSecGain]];

	for(const val of debugArray) {
		ns.tprint(val.toString());
	}
	//END OF DEBUG ZONE

	return;


}