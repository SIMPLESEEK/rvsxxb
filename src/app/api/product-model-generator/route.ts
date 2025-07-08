import { NextRequest, NextResponse } from 'next/server'
import { ProductModelGenerator } from '@/lib/services/ProductModelGenerator'
import { getUserFromToken } from '@/lib/auth'

// 生成产品型号
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { baseModel, variables, ruleId } = await request.json()

    // 验证必填字段
    if (!baseModel) {
      return NextResponse.json(
        { error: '基础型号不能为空' },
        { status: 400 }
      )
    }

    // 生成型号
    const generatedModel = await ProductModelGenerator.generateModel(
      baseModel,
      variables || {},
      ruleId
    )

    // 验证生成的型号
    const validation = ProductModelGenerator.validateGeneratedModel(generatedModel)

    return NextResponse.json({
      baseModel,
      variables,
      generatedModel,
      validation
    })

  } catch (error) {
    console.error('生成产品型号失败:', error)
    return NextResponse.json(
      { error: '生成产品型号失败' },
      { status: 500 }
    )
  }
}

// 批量生成产品型号
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { baseModel, variableCombinations, ruleId } = await request.json()

    // 验证必填字段
    if (!baseModel || !Array.isArray(variableCombinations)) {
      return NextResponse.json(
        { error: '基础型号和变量组合不能为空' },
        { status: 400 }
      )
    }

    // 批量生成型号
    const generatedModels = await ProductModelGenerator.generateBatchModels(
      baseModel,
      variableCombinations,
      ruleId
    )

    // 验证所有生成的型号
    const results = generatedModels.map((model, index) => {
      const validation = ProductModelGenerator.validateGeneratedModel(model)
      return {
        index,
        variables: variableCombinations[index],
        generatedModel: model,
        validation
      }
    })

    return NextResponse.json({
      baseModel,
      results,
      total: results.length,
      valid: results.filter(r => r.validation.isValid).length,
      invalid: results.filter(r => !r.validation.isValid).length
    })

  } catch (error) {
    console.error('批量生成产品型号失败:', error)
    return NextResponse.json(
      { error: '批量生成产品型号失败' },
      { status: 500 }
    )
  }
}

// 解析产品型号中的变量信息
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { model, baseModel, ruleId } = await request.json()

    // 验证必填字段
    if (!model || !baseModel) {
      return NextResponse.json(
        { error: '型号和基础型号不能为空' },
        { status: 400 }
      )
    }

    // 解析型号中的变量信息
    const variables = await ProductModelGenerator.parseModelVariables(
      model,
      baseModel,
      ruleId
    )

    return NextResponse.json({
      model,
      baseModel,
      variables,
      success: variables !== null
    })

  } catch (error) {
    console.error('解析产品型号失败:', error)
    return NextResponse.json(
      { error: '解析产品型号失败' },
      { status: 500 }
    )
  }
}
