'use client'

import React from 'react'
import { useState } from 'react'

type Item = {
  id: string
  item: string
  codigo: string
  descricao: string
  quantidade: number
  unidade: string
  valor_unitario: number
}

type Categoria = {
  id: string
  nome: string
  itens: Item[]
  collapsed?: boolean
}

export function CustoPlanTab() {
  const [data, setData] = useState<Item[]>([
    {
      id: '1',
      item: '1.1',
      codigo: '001',
      descricao: 'Alvenaria estrutural',
      quantidade: 100,
      unidade: 'm²',
      valor_unitario: 120,
    },
  ])

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const [categorias, setCategorias] = useState<Categoria[]>([
  {
    id: '1',
    nome: 'Serviços preliminares',
    itens: [],
  },
])

function addCategoria() {
  setCategorias((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      nome: 'Nova categoria',
      itens: [],
    },
  ])
}

function addItem(categoriaId: string) {
  setCategorias((prev) =>
    prev.map((cat) =>
      cat.id === categoriaId
        ? {
            ...cat,
            itens: [
              ...cat.itens,
              {
                id: Date.now().toString(),
                item: '',
                codigo: '',
                descricao: '',
                quantidade: 0,
                unidade: '',
                valor_unitario: 0,
              },
            ],
          }
        : cat
    )
  )
}

function updateItem(
  categoriaId: string,
  itemId: string,
  field: keyof Item,
  value: any
) {
  setCategorias((prev) =>
    prev.map((cat) =>
      cat.id === categoriaId
        ? {
            ...cat,
            itens: cat.itens.map((item) =>
              item.id === itemId
                ? { ...item, [field]: value }
                : item
            ),
          }
        : cat
    )
  )
}

function updateCategoriaNome(id: string, nome: string) {
  setCategorias((prev) =>
    prev.map((cat) =>
      cat.id === id ? { ...cat, nome } : cat
    )
  )
}

function removeCategoria(id: string) {
  setCategorias((prev) => prev.filter((cat) => cat.id !== id))
}

function removeItem(categoriaId: string, itemId: string) {
  setCategorias((prev) =>
    prev.map((cat) =>
      cat.id === categoriaId
        ? {
            ...cat,
            itens: cat.itens.filter((item) => item.id !== itemId),
          }
        : cat
    )
  )
}

function getTotalCategoria(itens: Item[]) {
  return itens.reduce(
    (sum, item) => sum + item.quantidade * item.valor_unitario,
    0
  )
}

function getTotalGeral() {
  return categorias.reduce(
    (total, cat) => total + getTotalCategoria(cat.itens),
    0
  )
}

function toggleCategoria(id: string) {
  setCategorias((prev) =>
    prev.map((cat) =>
      cat.id === id
        ? { ...cat, collapsed: !cat.collapsed }
        : cat
    )
  )
}

  return (
    <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/10">
<div className="flex justify-between items-center mb-4">
  <h2 className="text-white text-lg font-semibold">
    Planilha de Venda
  </h2>

  <div className="text-right">
    <p className="text-gray-400 text-xs">Total Geral</p>
    <p className="text-green-400 text-xl font-bold">
      {formatCurrency(getTotalGeral())}
    </p>
  </div>
</div>

      <button
  onClick={addCategoria}
  className="bg-green-600 px-4 py-2 rounded-lg"
>
  + Categoria
</button>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-white/10">
            <tr>
              <th className="text-left p-2">Item</th>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Qtd</th>
              <th className="text-left p-2">Un</th>
              <th className="text-right p-2">Valor Unit.</th>
              <th className="text-right p-2">Total</th>
            </tr>
          </thead>

<tbody>
  {categorias.map((cat, index) => (
    <React.Fragment key={cat.id}>
      {/* CATEGORIA */}
<tr className="group bg-[#1a1a1a] border-y border-white/10 hover:bg-[#222] transition">
  <td colSpan={8} className="p-2">
    
    <div className="flex items-center w-full gap-3">
      
      {/* ESQUERDA */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        
        {/* TOGGLE */}
        <button
          onClick={() => toggleCategoria(cat.id)}
          className="text-gray-400 hover:text-white transition"
        >
          {cat.collapsed ? '▶' : '▼'}
        </button>

        <span className="text-gray-400">{index + 1}.</span>

        <input
          value={cat.nome}
          onChange={(e) =>
            updateCategoriaNome(cat.id, e.target.value)
          }
          className="bg-transparent outline-none font-semibold text-white"
        />

        {/* DELETE */}
        <button
          onClick={() => removeCategoria(cat.id)}
          className="text-red-500 opacity-0 group-hover:opacity-100 transition ml-1"
        >
          ✕
        </button>
      </div>

      {/* LINHA */}
      <div className="flex-1 border-b border-dashed border-white/10"></div>

      {/* TOTAL */}
      <div className="text-green-400 font-bold text-sm whitespace-nowrap">
        {formatCurrency(getTotalCategoria(cat.itens))}
      </div>

    </div>

  </td>
</tr>

      {/* ITENS */}
      {!cat.collapsed &&
      cat.itens.map((row, i) => {
        const total = row.quantidade * row.valor_unitario

        return (
          <React.Fragment key={row.id}>
          <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
            <td className="p-1">{index + 1}.{i + 1}</td>

            <td className="p-1">
              <input
                value={row.codigo}
                onChange={(e) =>
                  updateItem(cat.id, row.id, 'codigo', e.target.value)
                }
                className="bg-transparent w-full"
              />
            </td>

            <td className="p-1">
              <input
                value={row.descricao}
                onChange={(e) =>
                  updateItem(cat.id, row.id, 'descricao', e.target.value)
                }
                className="bg-transparent w-full"
              />
            </td>

            <td className="p-1 text-right">
              <input
                type="number"
                value={row.quantidade}
                onChange={(e) =>
                  updateItem(
                    cat.id,
                    row.id,
                    'quantidade',
                    Number(e.target.value)
                  )
                }
                className="bg-transparent w-full text-right"
              />
            </td>

            <td className="p-1">
              <input
                value={row.unidade}
                onChange={(e) =>
                  updateItem(cat.id, row.id, 'unidade', e.target.value)
                }
                className="bg-transparent w-full"
              />
            </td>

            <td className="p-1 text-right">
              <input
                type="number"
                value={row.valor_unitario}
                onChange={(e) =>
                  updateItem(
                    cat.id,
                    row.id,
                    'valor_unitario',
                    Number(e.target.value)
                  )
                }
                className="bg-transparent w-full text-right"
              />
            </td>

            <td className="p-2 text-right text-green-400">
              {formatCurrency(total)}
            </td>

<td>
  <button
    onClick={() => removeItem(cat.id, row.id)}
    className="group border-b border-white/5 hover:bg-white/5"
  >
    ✕
  </button>
</td>

          </tr>


          </React.Fragment>
        )
      })}



      {/* BOTÃO ADD ITEM */}
      {!cat.collapsed && (
  <tr>
    <td colSpan={8}>
      <button
        onClick={() => addItem(cat.id)}
        className="text-blue-400 text-sm"
      >
        + Adicionar item
      </button>
    </td>
  </tr>
)}
    </React.Fragment>
  ))}
</tbody>
        </table>
      </div>
    </div>
  )
}