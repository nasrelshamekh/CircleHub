import { CirclePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CommunityImageUpload from "@/components/communityimages/CommunityImageUpload";
import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCommunityCategories } from "@/hooks/useCommunityCategories";
import { useCreateCommunity } from "@/hooks/mutations/useCreateCommunity";

const visibilityOptions = [
    {
        value: "public",
        label: "Public",
    },
    {
        value: "private",
        label: "Private",
    },
];

export default function CreateCommunityModal({ open, onOpenChange }) {
    const { categories } = useCommunityCategories();
    const categoryOptions = [
        {
            value: "",
            label: "Select a category",
        },
        ...categories.map((category) => ({
            value: category,
            label: category,
        })),
    ];
    const [formData, setFormData] = useState({
        imageUrl: "",
        coverImageUrl: "",
        name: "",
        category: "",
        visibility: "public",
        description: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const createCommunity = useCreateCommunity();

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleSubmit() {
        const name = formData.name.trim();
        const category = formData.category.trim();
        const description = formData.description.trim();

        if (name.length < 2) {
            toast.error("Community name must be at least 2 characters");
            return;
        }

        if (category.length < 2) {
            toast.error("Category is required");
            return;
        }

        if (description.length < 10) {
            toast.error("Description must be at least 10 characters");
            return;
        }

        createCommunity.mutate(
            {
                name,
                category,
                description,
                visibility: formData.visibility,
                image: imageFile,
                coverImage: coverFile,
            },
            {
                onSuccess: () => {
                    setFormData({
                        imageUrl: "",
                        coverImageUrl: "",
                        name: "",
                        category: "",
                        visibility: "public",
                        description: "",
                    });
                    setImageFile(null);
                    setCoverFile(null);
                    onOpenChange(false);
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] overflow-y-auto text-primary">
                <DialogHeader>
                    <DialogTitle>Create Community</DialogTitle>
                    <DialogDescription>
                        Set up a new community for people to join and share posts.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmit();
                    }}
                    className="flex flex-col gap-5"
                >
                    <div>
                        <CommunityImageUpload
                            variant="cover"
                            imageSrc={formData.coverImageUrl}
                            originalImageSrc=""
                            onImageChange={(imageUrl, file) => {
                                setCoverFile(file);
                                setFormData((currentData) => ({ ...currentData, coverImageUrl: imageUrl }));
                            }}
                            alt="Community Cover"
                        />

                        <CommunityImageUpload
                            variant="avatar"
                            className="relative ml-4 -mt-13 h-26 w-26 lg:-mt-18 lg:h-32 lg:w-32"
                            imageSrc={formData.imageUrl}
                            originalImageSrc=""
                            onImageChange={(imageUrl, file) => {
                                setImageFile(file);
                                setFormData((currentData) => ({ ...currentData, imageUrl }));
                            }}
                            alt="Community Image"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="create-community-name"
                                className="type-body-sm text-(--primary)"
                            >
                                Community Name
                            </label>
                            <input
                                id="create-community-name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="create-community-category"
                                className="type-body-sm cursor-pointer text-(--primary)"
                            >
                                Category
                            </label>
                            <ThemedDropdownSelect
                                id="create-community-category"
                                value={formData.category}
                                options={categoryOptions}
                                ariaLabel="Select community category"
                                onChange={(category) =>
                                    setFormData((currentData) => ({
                                        ...currentData,
                                        category,
                                    }))
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="create-community-visibility"
                                className="type-body-sm cursor-pointer text-(--primary)"
                            >
                                Visibility
                            </label>
                            <ThemedDropdownSelect
                                id="create-community-visibility"
                                value={formData.visibility}
                                options={visibilityOptions}
                                ariaLabel="Select community visibility"
                                onChange={(visibility) =>
                                    setFormData((currentData) => ({
                                        ...currentData,
                                        visibility,
                                    }))
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label
                                htmlFor="create-community-description"
                                className="type-body-sm text-(--primary)"
                            >
                                Description
                            </label>
                            <textarea
                                id="create-community-description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="input-surface type-body-sm w-full resize-none rounded-lg px-4 py-3 text-primary outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={createCommunity.isPending}
                        className="button-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60"
                    >
                        <CirclePlus size={20} />
                        {createCommunity.isPending ? "Creating..." : "Create Community"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}