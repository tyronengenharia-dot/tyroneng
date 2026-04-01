import { MateriaisTable } from './materiais/MateriaisTable'
import { MaquinarioTable } from './maquinario/MaquinarioTable'
import { VeiculosTable } from './veiculos/VeiculosTable'
import { EquipamentosTable } from './equipamentos/EquipamentosTable'

export function EstoqueTabs({ activeTab, setActiveTab }: any) {
  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
        {['materiais', 'equipamentos', 'veiculos', 'maquinario'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize px-3 py-1 rounded-lg ${
              activeTab === tab
                ? 'bg-blue-600'
                : 'text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'materiais' && <MateriaisTable />}
      {activeTab === 'equipamentos' && <EquipamentosTable />}
      {activeTab === 'veiculos' && <VeiculosTable />}
      {activeTab === 'maquinario' && <MaquinarioTable />}
     
    </div>
  )
}