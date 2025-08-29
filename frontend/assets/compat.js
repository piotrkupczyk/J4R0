
// Proste reguły kompatybilności (możesz rozbudować)
function checkCompatibilityState(builder){
  let ok = true; const msgs = [];
  const b = builder;

  if (b.CPU && b.Motherboard){
    if (b.CPU.socket !== b.Motherboard.socket){ ok=false; msgs.push(`Socket CPU (${b.CPU.socket}) ≠ płyta (${b.Motherboard.socket})`); }
  }
  if (b.RAM && b.Motherboard){
    if (b.RAM.ramType !== b.Motherboard.ramType){ ok=false; msgs.push(`RAM ${b.RAM.ramType} ≠ płyta ${b.Motherboard.ramType}`); }
  }
  if (b.GPU && b.Case){
    if (b.GPU.length > b.Case.gpuMax){ ok=false; msgs.push(`GPU ${b.GPU.length}mm > obudowa ${b.Case.gpuMax}mm`); }
  }
  if (b.PSU && (b.CPU || b.GPU)){
    const budget = (b.CPU?.tdp||0) + (b.GPU?.tdp||0) + 200; // zapas mocy
    if (b.PSU.watt < budget){ ok=false; msgs.push(`PSU ${b.PSU.watt}W < zalecane ${budget}W`); }
  }
  return { ok, msgs };
}
