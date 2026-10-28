// Pre-loaded sample assignments matching course files
// Asig 7 (Shopping Cart with Loops) and Asig 6 (Calculator with Subcharts)

const SAMPLES = {
  asig7: {
    title: "Asig 7 - Shopping Cart",
    tabs: [
      {
        name: "main",
        nodes: [
          {
            id: "m_call_1",
            type: "call",
            callName: "Acomulador"
          },
          {
            id: "m_out_1",
            type: "output",
            expression: '"El total de articulos son: " + art + " El precio es: " + prec'
          },
          {
            id: "m_call_2",
            type: "call",
            callName: "IVU"
          },
          {
            id: "m_out_2",
            type: "output",
            expression: '" El total con IVU es: " + ivu'
          }
        ]
      },
      {
        name: "Acomulador",
        nodes: [
          {
            id: "ac_asg_1",
            type: "assignment",
            variable: "art",
            expression: "0"
          },
          {
            id: "ac_asg_2",
            type: "assignment",
            variable: "prec",
            expression: "0"
          },
          {
            id: "ac_loop_1",
            type: "loop",
            condition: 'prec1 = "no"',
            beforeNodes: [
              {
                id: "lp_in_1",
                type: "input",
                prompt: "Entrar precio de articulo: ",
                variable: "prec1"
              },
              {
                id: "lp_asg_1",
                type: "assignment",
                variable: "prec",
                expression: "prec + prec1"
              },
              {
                id: "lp_asg_2",
                type: "assignment",
                variable: "art",
                expression: "art + 1"
              },
              {
                id: "lp_in_2",
                type: "input",
                prompt: "¿Quiere añadir otro articula? (si/no)",
                variable: "prec1"
              }
            ],
            afterNodes: []
          }
        ]
      },
      {
        name: "IVU",
        nodes: [
          {
            id: "ivu_asg_1",
            type: "assignment",
            variable: "ivu",
            expression: "prec * 0.115"
          },
          {
            id: "ivu_asg_2",
            type: "assignment",
            variable: "ivu",
            expression: "ivu + prec"
          }
        ]
      }
    ]
  },

  asig6: {
    title: "Asig 6 - Calculator",
    tabs: [
      {
        name: "main",
        nodes: [
          {
            id: "c_in_1",
            type: "input",
            prompt: "Entre el primer numero: ",
            variable: "num1"
          },
          {
            id: "c_in_2",
            type: "input",
            prompt: "Entre el segundo numero: ",
            variable: "num2"
          },
          {
            id: "c_in_3",
            type: "input",
            prompt: "Seleccione operacion: SUMA (+), RESTA (-), Multiplicacion (x) o Division (/)",
            variable: "operacion"
          },
          {
            id: "c_sel_1",
            type: "selection",
            condition: 'operacion = "+"',
            thenNodes: [
              {
                id: "c_call_suma",
                type: "call",
                callName: "SUMA"
              }
            ],
            elseNodes: [
              {
                id: "c_sel_2",
                type: "selection",
                condition: 'operacion = "-"',
                thenNodes: [
                  {
                    id: "c_call_resta",
                    type: "call",
                    callName: "RESTA"
                  }
                ],
                elseNodes: [
                  {
                    id: "c_sel_3",
                    type: "selection",
                    condition: 'operacion = "x"',
                    thenNodes: [
                      {
                        id: "c_call_mult",
                        type: "call",
                        callName: "MULTIPLICACION"
                      }
                    ],
                    elseNodes: [
                      {
                        id: "c_sel_4",
                        type: "selection",
                        condition: "num1 = 0 or num2 = 0",
                        thenNodes: [
                          {
                            id: "c_out_zero",
                            type: "output",
                            expression: '"No es posible dividir entre cero, intenta de nuevo"'
                          }
                        ],
                        elseNodes: [
                          {
                            id: "c_call_div",
                            type: "call",
                            callName: "DIVISION"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "SUMA",
        nodes: [
          {
            id: "s_asg_1",
            type: "assignment",
            variable: "suma",
            expression: "num1 + num2"
          },
          {
            id: "s_out_1",
            type: "output",
            expression: '"La suma da un total de: " + suma'
          }
        ]
      },
      {
        name: "RESTA",
        nodes: [
          {
            id: "r_asg_1",
            type: "assignment",
            variable: "resta",
            expression: "num1 - num2"
          },
          {
            id: "r_out_1",
            type: "output",
            expression: '"La resta da un total de: " + resta'
          }
        ]
      },
      {
        name: "MULTIPLICACION",
        nodes: [
          {
            id: "m_asg_1",
            type: "assignment",
            variable: "multiplicacion",
            expression: "num1 * num2"
          },
          {
            id: "m_out_1",
            type: "output",
            expression: '"La multiplicacion da un total de: " + multiplicacion'
          }
        ]
      },
      {
        name: "DIVISION",
        nodes: [
          {
            id: "d_asg_1",
            type: "assignment",
            variable: "division",
            expression: "num1 / num2"
          },
          {
            id: "d_out_1",
            type: "output",
            expression: '"La division da un total de: " + division'
          }
        ]
      }
    ]
  },

  boleteria: {
  "title": "Boleteria Cine",
  "tabs": [
    {
      "name": "main",
      "nodes": [
        {
          "id": "main_node_1",
          "type": "assignment",
          "variable": "cant_adultos",
          "expression": "0"
        },
        {
          "id": "main_node_2",
          "type": "assignment",
          "variable": "cant_menores",
          "expression": "0"
        },
        {
          "id": "main_node_3",
          "type": "assignment",
          "variable": "cant_envejecientes",
          "expression": "0"
        },
        {
          "id": "main_node_4",
          "type": "assignment",
          "variable": "total_asistentes",
          "expression": "0"
        },
        {
          "id": "main_node_5",
          "type": "assignment",
          "variable": "total_boletos",
          "expression": "0"
        },
        {
          "id": "main_node_6",
          "type": "assignment",
          "variable": "total_snacks",
          "expression": "0"
        },
        {
          "id": "main_node_7",
          "type": "assignment",
          "variable": "continuar",
          "expression": "\"si\""
        },
        {
          "id": "main_node_8",
          "type": "loop",
          "condition": "total_asistentes >= 50 or continuar = \"no\"",
          "beforeNodes": [
            {
              "id": "main_node_9",
              "type": "call",
              "callName": "Contador"
            },
            {
              "id": "main_node_10",
              "type": "call",
              "callName": "Dulceria"
            },
            {
              "id": "main_node_11",
              "type": "call",
              "callName": "Acomulador"
            },
            {
              "id": "main_node_12",
              "type": "selection",
              "condition": "total_asistentes < 50",
              "thenNodes": [
                {
                  "id": "main_node_13",
                  "type": "input",
                  "prompt": "\"¿Desea registrar otro asistente? (si/no)\"",
                  "variable": "continuar"
                }
              ],
              "elseNodes": [
                {
                  "id": "main_node_14",
                  "type": "output",
                  "expression": "\"¡Se ha alcanzado la capacidad maxima de 50 asientos!\""
                },
                {
                  "id": "main_node_15",
                  "type": "assignment",
                  "variable": "continuar",
                  "expression": "\"no\""
                }
              ]
            }
          ],
          "afterNodes": []
        },
        {
          "id": "main_node_16",
          "type": "call",
          "callName": "IVU"
        },
        {
          "id": "main_node_17",
          "type": "output",
          "expression": "\"========================================\""
        },
        {
          "id": "main_node_18",
          "type": "output",
          "expression": "\"    RESUMEN BOLETERIA DE CINE\""
        },
        {
          "id": "main_node_19",
          "type": "output",
          "expression": "\"========================================\""
        },
        {
          "id": "main_node_20",
          "type": "output",
          "expression": "\"Cantidad de menores (<12 anos): \" + cant_menores"
        },
        {
          "id": "main_node_21",
          "type": "output",
          "expression": "\"Cantidad de adultos (12-65 anos): \" + cant_adultos"
        },
        {
          "id": "main_node_22",
          "type": "output",
          "expression": "\"Cantidad de envejecientes (>65 anos): \" + cant_envejecientes"
        },
        {
          "id": "main_node_23",
          "type": "output",
          "expression": "\"Total de asistentes registrados: \" + total_asistentes"
        },
        {
          "id": "main_node_24",
          "type": "output",
          "expression": "\"Asientos disponibles restantes: \" + (50 - total_asistentes)"
        },
        {
          "id": "main_node_25",
          "type": "output",
          "expression": "\"----------------------------------------\""
        },
        {
          "id": "main_node_26",
          "type": "output",
          "expression": "\"Total en ventas de boletos: $\" + total_boletos"
        },
        {
          "id": "main_node_27",
          "type": "output",
          "expression": "\"Total en ventas de snacks: $\" + total_snacks"
        },
        {
          "id": "main_node_28",
          "type": "output",
          "expression": "\"Subtotal recaudado: $\" + subtotal"
        },
        {
          "id": "main_node_29",
          "type": "output",
          "expression": "\"Total IVU (11.5%): $\" + ivu"
        },
        {
          "id": "main_node_30",
          "type": "output",
          "expression": "\"TOTAL GENERAL OBTENIDO: $\" + total_general"
        },
        {
          "id": "main_node_31",
          "type": "output",
          "expression": "\"========================================\""
        }
      ],
      "startComment": {
        "num_lines": 10,
        "lines": [
          "START: Boleteria_Cine",
          "Boleteria de Cine (50 asientos)",
          "LOOP: Atender clientes hasta limite o salida",
          "CALL: Contador (clasifica edad y cuenta)",
          "CALL: Dulceria (selecciona snacks)",
          "CALL: Acomulador (acumula ventas)",
          "CALL: IVU (calcula impuestos)",
          "PRINT: Resumen final de asistencia y dinero",
          "END: Boleteria_Cine",
          ""
        ],
        "text": "START: Boleteria_Cine\nBoleteria de Cine (50 asientos)\nLOOP: Atender clientes hasta limite o salida\nCALL: Contador (clasifica edad y cuenta)\nCALL: Dulceria (selecciona snacks)\nCALL: Acomulador (acumula ventas)\nCALL: IVU (calcula impuestos)\nPRINT: Resumen final de asistencia y dinero\nEND: Boleteria_Cine\n",
        "x": 295,
        "y": 41,
        "hostX": 203,
        "hostY": 18
      }
    },
    {
      "name": "Contador",
      "nodes": [
        {
          "id": "Contador_node_32",
          "type": "input",
          "prompt": "\"Ingrese la edad del asistente:\"",
          "variable": "edad"
        },
        {
          "id": "Contador_node_33",
          "type": "selection",
          "condition": "edad < 12",
          "thenNodes": [
            {
              "id": "Contador_node_34",
              "type": "assignment",
              "variable": "cant_menores",
              "expression": "cant_menores + 1"
            },
            {
              "id": "Contador_node_35",
              "type": "assignment",
              "variable": "precio_boleto",
              "expression": "5"
            },
            {
              "id": "Contador_node_36",
              "type": "output",
              "expression": "\"Boleto menor de 12 años aplicado: $5.00\""
            }
          ],
          "elseNodes": [
            {
              "id": "Contador_node_37",
              "type": "selection",
              "condition": "edad > 65",
              "thenNodes": [
                {
                  "id": "Contador_node_38",
                  "type": "assignment",
                  "variable": "cant_envejecientes",
                  "expression": "cant_envejecientes + 1"
                },
                {
                  "id": "Contador_node_39",
                  "type": "assignment",
                  "variable": "precio_boleto",
                  "expression": "7"
                },
                {
                  "id": "Contador_node_40",
                  "type": "output",
                  "expression": "\"Boleto envejeciente (>65 años) aplicado: $7.00\""
                }
              ],
              "elseNodes": [
                {
                  "id": "Contador_node_41",
                  "type": "assignment",
                  "variable": "cant_adultos",
                  "expression": "cant_adultos + 1"
                },
                {
                  "id": "Contador_node_42",
                  "type": "assignment",
                  "variable": "precio_boleto",
                  "expression": "10"
                },
                {
                  "id": "Contador_node_43",
                  "type": "output",
                  "expression": "\"Boleto adulto aplicado: $10.00\""
                }
              ]
            }
          ]
        },
        {
          "id": "Contador_node_44",
          "type": "assignment",
          "variable": "total_asistentes",
          "expression": "total_asistentes + 1"
        }
      ],
      "startComment": {
        "num_lines": 6,
        "lines": [
          "START: Contador",
          "READ: edad",
          "IF: edad < 12 -> Menor ($5)",
          "ELSEIF: edad > 65 -> Envejeciente ($7)",
          "ELSE -> Adulto ($10)",
          "END: Contador"
        ],
        "text": "START: Contador\nREAD: edad\nIF: edad < 12 -> Menor ($5)\nELSEIF: edad > 65 -> Envejeciente ($7)\nELSE -> Adulto ($10)\nEND: Contador",
        "x": 200,
        "y": 45,
        "hostX": 144,
        "hostY": 18
      }
    },
    {
      "name": "Dulceria",
      "nodes": [
        {
          "id": "Dulceria_node_45",
          "type": "assignment",
          "variable": "precio_snack",
          "expression": "0"
        },
        {
          "id": "Dulceria_node_46",
          "type": "input",
          "prompt": "\"¿Desea comprar en la dulceria (Pop Corn, refresco, etc)? (si/no)\"",
          "variable": "desea_snack"
        },
        {
          "id": "Dulceria_node_47",
          "type": "selection",
          "condition": "desea_snack = \"si\" or desea_snack = \"SI\" or desea_snack = \"Si\"",
          "thenNodes": [
            {
              "id": "Dulceria_node_48",
              "type": "input",
              "prompt": "\"Seleccione snack: 1-Pop Corn ($4.00), 2-Refresco ($2.50), 3-Combo ($6.00)\"",
              "variable": "opcion_snack"
            },
            {
              "id": "Dulceria_node_49",
              "type": "selection",
              "condition": "opcion_snack = 1",
              "thenNodes": [
                {
                  "id": "Dulceria_node_50",
                  "type": "assignment",
                  "variable": "precio_snack",
                  "expression": "4"
                },
                {
                  "id": "Dulceria_node_51",
                  "type": "output",
                  "expression": "\"Venta agregada: Pop Corn ($4.00)\""
                }
              ],
              "elseNodes": [
                {
                  "id": "Dulceria_node_52",
                  "type": "selection",
                  "condition": "opcion_snack = 2",
                  "thenNodes": [
                    {
                      "id": "Dulceria_node_53",
                      "type": "assignment",
                      "variable": "precio_snack",
                      "expression": "2.5"
                    },
                    {
                      "id": "Dulceria_node_54",
                      "type": "output",
                      "expression": "\"Venta agregada: Refresco ($2.50)\""
                    }
                  ],
                  "elseNodes": [
                    {
                      "id": "Dulceria_node_55",
                      "type": "selection",
                      "condition": "opcion_snack = 3",
                      "thenNodes": [
                        {
                          "id": "Dulceria_node_56",
                          "type": "assignment",
                          "variable": "precio_snack",
                          "expression": "6"
                        },
                        {
                          "id": "Dulceria_node_57",
                          "type": "output",
                          "expression": "\"Venta agregada: Combo Pop Corn y Refresco ($6.00)\""
                        }
                      ],
                      "elseNodes": [
                        {
                          "id": "Dulceria_node_58",
                          "type": "output",
                          "expression": "\"Opcion de snack no valida\""
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "elseNodes": []
        }
      ],
      "startComment": {
        "num_lines": 6,
        "lines": [
          "START: Dulceria",
          "READ: desea_snack",
          "IF desea: 1->Pop Corn ($4.00)",
          "          2->Refresco ($2.50)",
          "          3->Combo ($6.00)",
          "END: Dulceria"
        ],
        "text": "START: Dulceria\nREAD: desea_snack\nIF desea: 1->Pop Corn ($4.00)\n          2->Refresco ($2.50)\n          3->Combo ($6.00)\nEND: Dulceria",
        "x": 200,
        "y": 45,
        "hostX": 144,
        "hostY": 18
      }
    },
    {
      "name": "Acomulador",
      "nodes": [
        {
          "id": "Acomulador_node_59",
          "type": "assignment",
          "variable": "total_boletos",
          "expression": "total_boletos + precio_boleto"
        },
        {
          "id": "Acomulador_node_60",
          "type": "assignment",
          "variable": "total_snacks",
          "expression": "total_snacks + precio_snack"
        }
      ],
      "startComment": {
        "num_lines": 4,
        "lines": [
          "START: Acomulador",
          "total_boletos = total_boletos + precio_boleto",
          "total_snacks = total_snacks + precio_snack",
          "END: Acomulador"
        ],
        "text": "START: Acomulador\ntotal_boletos = total_boletos + precio_boleto\ntotal_snacks = total_snacks + precio_snack\nEND: Acomulador",
        "x": 200,
        "y": 45,
        "hostX": 144,
        "hostY": 18
      }
    },
    {
      "name": "IVU",
      "nodes": [
        {
          "id": "IVU_node_61",
          "type": "assignment",
          "variable": "subtotal",
          "expression": "total_boletos + total_snacks"
        },
        {
          "id": "IVU_node_62",
          "type": "assignment",
          "variable": "ivu",
          "expression": "subtotal * 0.115"
        },
        {
          "id": "IVU_node_63",
          "type": "assignment",
          "variable": "total_general",
          "expression": "subtotal + ivu"
        }
      ],
      "startComment": {
        "num_lines": 5,
        "lines": [
          "START: IVU",
          "subtotal = total_boletos + total_snacks",
          "ivu = subtotal * 0.115 (11.5%)",
          "total_general = subtotal + ivu",
          "END: IVU"
        ],
        "text": "START: IVU\nsubtotal = total_boletos + total_snacks\nivu = subtotal * 0.115 (11.5%)\ntotal_general = subtotal + ivu\nEND: IVU",
        "x": 200,
        "y": 45,
        "hostX": 144,
        "hostY": 18
      }
    }
  ]
},

  blank: {
    title: "Untitled Flowchart",
    tabs: [
      {
        name: "main",
        nodes: []
      }
    ]
  }
};

if (typeof module !== 'undefined') {
  module.exports = { SAMPLES };
}
