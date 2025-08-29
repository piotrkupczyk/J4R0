
// MOCK danych – łatwe do podmiany na fetch('/api/...')
const MOCK = {
  CPU: [
    { id: 'cpu1', type: 'CPU', name: 'AMD Ryzen 5 5600', socket:'AM4', tdp:65, price:499 },
    { id: 'cpu2', type: 'CPU', name: 'Intel Core i5-12400F', socket:'LGA1700', tdp:65, price:699 },
  ],
  Motherboard: [
    { id:'mb1', type:'Motherboard', name:'MSI B550-A PRO', socket:'AM4', ramType:'DDR4', price:429 },
    { id:'mb2', type:'Motherboard', name:'ASUS PRIME B660M-A', socket:'LGA1700', ramType:'DDR4', price:549 },
  ],
  RAM: [
    { id:'ram1', type:'RAM', name:'Kingston Fury 16GB (2x8) 3200 DDR4', ramType:'DDR4', sticks:2, size:16, price:189 },
    { id:'ram2', type:'RAM', name:'Corsair Vengeance 32GB (2x16) 3600 DDR4', ramType:'DDR4', sticks:2, size:32, price:349 },
  ],
  GPU: [
    { id:'gpu1', type:'GPU', name:'NVIDIA GeForce RTX 4060 8GB', length:242, tdp:115, price:1499 },
    { id:'gpu2', type:'GPU', name:'AMD Radeon RX 6700 XT 12GB', length:267, tdp:230, price:1699 },
  ],
  PSU: [
    { id:'psu1', type:'PSU', name:'Seasonic Focus 650W 80+ Gold', watt:650, price:449 },
    { id:'psu2', type:'PSU', name:'be quiet! Pure Power 550W 80+ Gold', watt:550, price:349 },
  ],
  Case: [
    { id:'case1', type:'Case', name:'NZXT H5 Flow', gpuMax:365, price:399 },
    { id:'case2', type:'Case', name:'Corsair 4000D', gpuMax:340, price:459 },
  ],
  Storage: [
    { id:'ssd1', type:'Storage', name:'Samsung 990 EVO 1TB NVMe', iface:'M.2 NVMe', price:399 },
    { id:'ssd2', type:'Storage', name:'WD Blue 1TB SATA', iface:'SATA', price:229 },
  ]
};
