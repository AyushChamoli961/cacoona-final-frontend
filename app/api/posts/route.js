import { NextResponse } from 'next/server';
import prisma from "@/lib/db"


export async function GET(request) {
    try {

        const { searchParams } = new URL(request.url);
  
    //   const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const posts = await prisma.post.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            }
          },
          comments: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  image: true,
                }
              },
              content: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          likes: {
            select: {
              userId: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
  
      const formattedPosts = posts.map(post => ({
        ...post,
        user: post.user.name,
        userImage: post.user.image,
        comments: post.comments.map(comment => ({
          userId: comment.userId,
          username: comment.user.name,
          userImage: comment.user.image,
          content: comment.content,
          commentId: comment.id
        }))
      }));
  
      const size = await prisma.post.count();
  
      return NextResponse.json({ message: "Fetched all posts successfully!", size, posts: formattedPosts });
    } catch (error) {
      console.error("[GET_POSTS]", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request) {
  try {
    

    const { email , title, content, images = [] } = await request.json();

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if(!user){
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        images,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Post created successfully!", data: post }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_POST]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
  
    const { email, postId } = await request.json();  // Extract email from request body

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }


    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: user.id,
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    await prisma.comment.deleteMany({
      where: {
        postId,
      },
    });

    await prisma.like.deleteMany({
      where: {
        postId,
      },
    });

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return NextResponse.json({ message: "Post deleted successfully!" });
  } catch (error) {
    console.error("[DELETE_POST]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {

  try {
    
  
      const {email,postId,  title, content, images } = await request.json();


      const user = await prisma.user.findUnique({
          where: {
            email
          }
      })
    
      if(!user){
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }


      const post = await prisma.post.findFirst({
        where: {
          id: postId,
          userId: user.id,
        },
      });
  
      if (!post) {
        return NextResponse.json({ message: "Post not found" }, { status: 404 });
      }
  
      const updatedPost = await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          title,
          content,
          images,
        },
      });
  
      return NextResponse.json({ message: "Post updated successfully!", data: updatedPost });
    } catch (error) {
      console.error("[UPDATE_POST]", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}